import { Prisma } from '../generated/prisma/client.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export type ActivityRecord = {
  id: string;
  action: AdminAction;
  entity: AdminEntity;
  type: string;
  title: string;
  entityId: string | null;
  summary: string;
  createdAt: Date;
};

type LogActivityInput = {
  action: AdminAction;
  entity: AdminEntity;
  entityId?: string | null;
  summary: string;
  /** Optional override; otherwise derived from action + entity. */
  type?: string;
  title?: string;
};

type ListActivitiesInput = {
  page: number;
  pageSize: number;
  search?: string;
  action?: AdminAction;
  entity?: AdminEntity;
  type?: string;
  from?: string;
  to?: string;
};

/** Types shown in the owner Activity History (business change log only). */
export const BUSINESS_ACTIVITY_TYPES = [
  'CATEGORY_CREATED',
  'CATEGORY_UPDATED',
  'CATEGORY_DELETED',
  'CATEGORY_TOGGLED',
  'MENU_ITEM_CREATED',
  'MENU_ITEM_UPDATED',
  'MENU_ITEM_DELETED',
  'MENU_ITEM_TOGGLED',
  'MENU_ITEM_PRICE_UPDATED',
  'MENU_ITEM_IMAGE_UPDATED',
  'MENU_ITEM_IMAGE_REMOVED',
  'RESTAURANT_UPDATED',
  'RESTAURANT_STATUS_UPDATED',
  'RESTAURANT_LOGO_UPDATED',
  'RESTAURANT_LOGO_REMOVED',
  'RESTAURANT_COVER_UPDATED',
  'RESTAURANT_COVER_REMOVED',
  'RESTAURANT_LOCATION_UPDATED',
  'RESTAURANT_HOURS_UPDATED',
  'RESTAURANT_CONTACT_UPDATED',
  'QR_TOKEN_REGENERATED',
] as const;

export type BusinessActivityType = (typeof BUSINESS_ACTIVITY_TYPES)[number];

const BUSINESS_TYPE_SET = new Set<string>(BUSINESS_ACTIVITY_TYPES);

const DEFAULT_META: Record<string, { type: string; title: string }> = {
  'CREATE:CATEGORY': { type: 'CATEGORY_CREATED', title: 'Category created' },
  'UPDATE:CATEGORY': { type: 'CATEGORY_UPDATED', title: 'Category updated' },
  'DELETE:CATEGORY': { type: 'CATEGORY_DELETED', title: 'Category deleted' },
  'TOGGLE:CATEGORY': { type: 'CATEGORY_TOGGLED', title: 'Category visibility changed' },
  'CREATE:MENU_ITEM': { type: 'MENU_ITEM_CREATED', title: 'Menu item added' },
  'UPDATE:MENU_ITEM': { type: 'MENU_ITEM_UPDATED', title: 'Menu item updated' },
  'DELETE:MENU_ITEM': { type: 'MENU_ITEM_DELETED', title: 'Menu item deleted' },
  'TOGGLE:MENU_ITEM': { type: 'MENU_ITEM_TOGGLED', title: 'Availability updated' },
  'UPDATE:RESTAURANT': { type: 'RESTAURANT_UPDATED', title: 'Restaurant information updated' },
  'UPDATE:QR': { type: 'QR_TOKEN_REGENERATED', title: 'Public menu link regenerated' },
};

function resolveMeta(input: LogActivityInput) {
  const fallback = DEFAULT_META[`${input.action}:${input.entity}`] ?? {
    type: `${input.entity}_${input.action}`,
    title: `${input.entity.replaceAll('_', ' ').toLowerCase()} ${input.action.toLowerCase()}`,
  };

  return {
    type: input.type ?? fallback.type,
    title: input.title ?? fallback.title,
  };
}

function isBusinessActivity(type: string, entity: AdminEntity, action: AdminAction): boolean {
  if (BUSINESS_TYPE_SET.has(type)) return true;

  // Legacy rows / fallbacks: restaurant catalog entities only (never OWNER / auth / downloads).
  if (entity === AdminEntity.OWNER) return false;
  if (action === AdminAction.LOGIN || action === AdminAction.LOGOUT) return false;
  if (action === AdminAction.DOWNLOAD) return false;
  if (entity === AdminEntity.SYSTEM) return false;
  if (entity === AdminEntity.QR && type !== 'QR_TOKEN_REGENERATED') return false;

  return (
    entity === AdminEntity.CATEGORY ||
    entity === AdminEntity.MENU_ITEM ||
    entity === AdminEntity.RESTAURANT
  );
}

/** Prisma filter: only business change history visible to owners. */
export function businessActivityWhere(): Prisma.AdminActivityWhereInput {
  return {
    AND: [
      {
        OR: [
          { type: { in: [...BUSINESS_ACTIVITY_TYPES] } },
          {
            entity: {
              in: [AdminEntity.CATEGORY, AdminEntity.MENU_ITEM, AdminEntity.RESTAURANT],
            },
            action: {
              notIn: [AdminAction.LOGIN, AdminAction.LOGOUT, AdminAction.DOWNLOAD],
            },
          },
          { type: 'QR_TOKEN_REGENERATED' },
        ],
      },
      {
        NOT: {
          OR: [
            { entity: AdminEntity.OWNER },
            { action: AdminAction.LOGIN },
            { action: AdminAction.LOGOUT },
            { action: AdminAction.DOWNLOAD },
            {
              type: {
                in: [
                  'OWNER_LOGIN',
                  'OWNER_LOGOUT',
                  'OWNER_PASSWORD_CHANGED',
                  'QR_DOWNLOADED',
                  'SYSTEM',
                ],
              },
            },
          ],
        },
      },
    ],
  };
}

function toActivityDto(activity: ActivityRecord) {
  return {
    id: activity.id,
    action: activity.action,
    entity: activity.entity,
    type: activity.type,
    title: activity.title,
    entityId: activity.entityId,
    summary: activity.summary,
    createdAt: activity.createdAt.toISOString(),
  };
}

function buildActivityWhere(input: Omit<ListActivitiesInput, 'page' | 'pageSize'>) {
  const filters: Prisma.AdminActivityWhereInput = {};

  if (input.action) filters.action = input.action;
  if (input.entity) filters.entity = input.entity;
  if (input.type?.trim()) filters.type = input.type.trim();

  const search = input.search?.trim();
  if (search) {
    filters.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { type: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (input.from || input.to) {
    filters.createdAt = {};
    if (input.from) {
      const fromDate = new Date(input.from);
      if (Number.isNaN(fromDate.getTime())) {
        throw AppError.field('from', 'Invalid start date.', 400);
      }
      filters.createdAt.gte = fromDate;
    }
    if (input.to) {
      const toDate = new Date(input.to);
      if (Number.isNaN(toDate.getTime())) {
        throw AppError.field('to', 'Invalid end date.', 400);
      }
      filters.createdAt.lte = toDate;
    }
  }

  return {
    AND: [businessActivityWhere(), filters],
  } satisfies Prisma.AdminActivityWhereInput;
}

/**
 * Records a business change for the owner Activity History.
 * Auth / session / password events are intentionally ignored (use logger if needed).
 */
export async function logAdminActivity(input: LogActivityInput): Promise<void> {
  const meta = resolveMeta(input);

  if (!isBusinessActivity(meta.type, input.entity, input.action)) {
    logger.debug('Skipped non-business activity log', {
      type: meta.type,
      entity: input.entity,
      action: input.action,
    });
    return;
  }

  await prisma.adminActivity.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      summary: input.summary,
      type: meta.type,
      title: meta.title,
    },
  });
}

/**
 * Non-blocking activity write — keeps CRUD responses off the activity-log critical path.
 * Failures are logged but never fail the parent mutation.
 */
export function queueAdminActivity(input: LogActivityInput): void {
  void logAdminActivity(input).catch((error: unknown) => {
    logger.error('Failed to record admin activity', { error });
  });
}

/** Remove auth/system noise from the owner-facing history (idempotent). */
export async function purgeNonBusinessActivities(): Promise<number> {
  const result = await prisma.adminActivity.deleteMany({
    where: {
      NOT: businessActivityWhere(),
    },
  });

  if (result.count > 0) {
    logger.info('Purged non-business activity records', { deleted: result.count });
  }

  return result.count;
}

export async function getRecentAdminActivities(limit = 10) {
  const rows = await prisma.adminActivity.findMany({
    where: businessActivityWhere(),
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.map(toActivityDto);
}

export async function getAdminActivityById(id: string) {
  const activity = await prisma.adminActivity.findFirst({
    where: { id, AND: [businessActivityWhere()] },
  });
  if (!activity) {
    throw new AppError('Activity not found.', 404);
  }
  return toActivityDto(activity);
}

export async function listAdminActivities(input: ListActivitiesInput) {
  const where = buildActivityWhere(input);
  const skip = (input.page - 1) * input.pageSize;

  const [total, rows] = await prisma.$transaction([
    prisma.adminActivity.count({ where }),
    prisma.adminActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: input.pageSize,
    }),
  ]);

  return {
    items: rows.map(toActivityDto),
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize) || 1),
    },
  };
}

export async function deleteAdminActivity(id: string) {
  const existing = await prisma.adminActivity.findFirst({
    where: { id, AND: [businessActivityWhere()] },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Activity not found.', 404);
  }

  await prisma.adminActivity.delete({ where: { id } });

  return { id };
}

export async function deleteAdminActivities(ids: string[]) {
  const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (uniqueIds.length === 0) {
    throw AppError.field('ids', 'Select at least one activity to delete.', 400);
  }

  const result = await prisma.adminActivity.deleteMany({
    where: {
      id: { in: uniqueIds },
      AND: [businessActivityWhere()],
    },
  });

  if (result.count === 0) {
    throw new AppError('No matching activities were found to delete.', 404);
  }

  return {
    deletedCount: result.count,
    requestedCount: uniqueIds.length,
  };
}
