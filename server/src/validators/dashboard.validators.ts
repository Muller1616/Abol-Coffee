import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  recentLimit: z.coerce.number().int().min(1).max(50).optional().default(5),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
