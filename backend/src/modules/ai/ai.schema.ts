import { z } from 'zod';

export const aiAgentTypes = ['TRIP_PLANNER', 'FLIGHT_HUNTER', 'LOCAL_GUIDE', 'BUDGET_ADVISOR'] as const;

export const sendMessageSchema = z.object({
  agentType: z.enum(aiAgentTypes).default('TRIP_PLANNER'),
  conversationId: z.string().optional(),
  message: z.string().min(1).max(4000),
  context: z.record(z.unknown()).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type AgentType = (typeof aiAgentTypes)[number];
