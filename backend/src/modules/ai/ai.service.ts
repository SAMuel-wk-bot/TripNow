import { AiAgentType, AiMessageRole } from '@prisma/client';

import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../utils/AppError';

import { agents } from './agents';
import type { SendMessageInput } from './ai.schema';

export interface SendMessageResult {
  conversationId: string;
  reply: string;
}

export async function sendMessage(
  userId: string,
  input: SendMessageInput,
): Promise<SendMessageResult> {
  const agent = agents[input.agentType];

  const conversation = input.conversationId
    ? await prisma.aiConversation.findFirst({
        where: { id: input.conversationId, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  const convo =
    conversation ??
    (await prisma.aiConversation.create({
      data: {
        userId,
        agentType: input.agentType as AiAgentType,
        title: input.message.slice(0, 80),
      },
      include: { messages: true },
    }));

  await prisma.aiMessage.create({
    data: {
      conversationId: convo.id,
      role: AiMessageRole.USER,
      content: input.message,
    },
  });

  const history = conversation?.messages ?? [];
  const reply = await callAnthropic(agent.systemPrompt, [
    ...history.map((m) => ({
      role: m.role === AiMessageRole.ASSISTANT ? ('assistant' as const) : ('user' as const),
      content: m.content,
    })),
    { role: 'user' as const, content: input.message },
  ]);

  await prisma.aiMessage.create({
    data: {
      conversationId: convo.id,
      role: AiMessageRole.ASSISTANT,
      content: reply,
    },
  });

  return { conversationId: convo.id, reply };
}

export async function listConversations(userId: string) {
  return prisma.aiConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getConversation(userId: string, id: string) {
  return prisma.aiConversation.findFirst({
    where: { id, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
}

async function callAnthropic(
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    logger.warn('ANTHROPIC_API_KEY not configured, returning stub response');
    return '(AI provider not configured) - configure ANTHROPIC_API_KEY to enable AI agents.';
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_DEFAULT_MODEL,
      max_tokens: 1024,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error({ status: res.status, body: text }, 'Anthropic call failed');
    throw new AppError('AI service error', 502, 'AI_PROVIDER_ERROR');
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  return data.content
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text)
    .join('\n');
}
