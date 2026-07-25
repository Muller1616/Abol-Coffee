import { prisma } from '../config/database.js';
import type { AdminAction, AdminEntity } from '../generated/prisma/client.js';

type LogActivityInput = {
  action: AdminAction;
  entity: AdminEntity;
  entityId?: string | null;
  summary: string;
};

export async function logAdminActivity(input: LogActivityInput): Promise<void> {
  await prisma.adminActivity.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      summary: input.summary,
    },
  });
}

export async function getRecentAdminActivities(limit = 10) {
  return prisma.adminActivity.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
