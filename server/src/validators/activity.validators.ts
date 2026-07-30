import { z } from 'zod';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(120).optional(),
  action: z.nativeEnum(AdminAction).optional(),
  entity: z.nativeEnum(AdminEntity).optional(),
  type: z.string().trim().max(80).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;

export const activityIdParamsSchema = z.object({
  id: z.string().min(1, 'Activity id is required'),
});

export type ActivityIdParams = z.infer<typeof activityIdParamsSchema>;

export const bulkDeleteActivitiesSchema = z.object({
  ids: z
    .array(z.string().min(1, 'Activity id is required'))
    .min(1, 'Select at least one activity to delete.')
    .max(100, 'You can delete at most 100 activities at once.'),
});

export type BulkDeleteActivitiesInput = z.infer<typeof bulkDeleteActivitiesSchema>;
