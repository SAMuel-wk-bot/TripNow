import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().min(1).optional(),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).toUpperCase().default('USD'),
  description: z.string().max(500).optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
