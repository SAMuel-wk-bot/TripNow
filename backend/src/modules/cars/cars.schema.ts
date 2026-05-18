import { z } from 'zod';

export const carSearchSchema = z.object({
  pickupLocation: z.string().min(2),
  dropoffLocation: z.string().min(2).optional(),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  dropoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  driverAge: z.coerce.number().int().min(18).max(99).default(30),
  currency: z.string().length(3).toUpperCase().default('USD'),
});

export type CarSearchInput = z.infer<typeof carSearchSchema>;
