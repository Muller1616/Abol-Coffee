import { z } from 'zod';

export const publicMenuQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.string().min(1).optional(),
});

export type PublicMenuQuery = z.infer<typeof publicMenuQuerySchema>;
