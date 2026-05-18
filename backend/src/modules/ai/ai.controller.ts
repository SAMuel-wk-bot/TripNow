import type { Request, Response } from 'express';

import { UnauthorizedError } from '../../utils/AppError';

import * as aiService from './ai.service';

function userId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.sub;
}

export async function sendMessageHandler(req: Request, res: Response): Promise<void> {
  const result = await aiService.sendMessage(userId(req), req.body);
  res.json(result);
}

export async function listConversationsHandler(req: Request, res: Response): Promise<void> {
  const conversations = await aiService.listConversations(userId(req));
  res.json({ count: conversations.length, conversations });
}

export async function getConversationHandler(req: Request, res: Response): Promise<void> {
  const conversation = await aiService.getConversation(userId(req), req.params.id);
  if (!conversation) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    return;
  }
  res.json(conversation);
}
