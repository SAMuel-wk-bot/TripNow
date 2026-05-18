import { z } from 'zod';

export const attractionsSearchSchema = z.object({
  city: z.string().min(2),
  country: z.string().length(2).toUpperCase().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const attractionByIdSchema = z.object({
  id: z.string().min(1),
});

export type AttractionsSearchInput = z.infer<typeof attractionsSearchSchema>;
