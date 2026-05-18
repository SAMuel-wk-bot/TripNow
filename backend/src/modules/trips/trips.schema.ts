import { z } from 'zod';

export const createTripSchema = z.object({
  title: z.string().min(1).max(120),
  destination: z.string().min(1).max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  budgetCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).toUpperCase().default('USD'),
  notes: z.string().max(2000).optional(),
});

export const updateTripSchema = createTripSchema.partial();

export const generateItinerarySchema = z.object({
  tripId: z.string().min(1),
  interests: z.array(z.string()).min(1).max(20),
  pace: z.enum(['RELAXED', 'BALANCED', 'PACKED']).default('BALANCED'),
  travelersCount: z.number().int().min(1).max(20).default(2),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type GenerateItineraryInput = z.infer<typeof generateItinerarySchema>;
