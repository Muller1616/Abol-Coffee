import { z } from 'zod';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(120).optional(),
  action: z.nativeEnum(AdminAction).optional(),
  entity: z.nativeEnum(AdminEntity).optional(),
  type: z.string().trim().max(80).optional(),
});

export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
