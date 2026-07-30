import { Prisma } from '../generated/prisma/client.js';
import type { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

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
  'UPDATE:OWNER': { type: 'OWNER_PASSWORD_CHANGED', title: 'Password changed' },
  'LOGIN:OWNER': { type: 'OWNER_LOGIN', title: 'Signed in' },
  'LOGOUT:OWNER': { type: 'OWNER_LOGOUT', title: 'Signed out' },
  'DOWNLOAD:QR': { type: 'QR_DOWNLOADED', title: 'QR code downloaded' },
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
  const where: Prisma.AdminActivityWhereInput = {};

  if (input.action) where.action = input.action;
  if (input.entity) where.entity = input.entity;
  if (input.type?.trim()) where.type = input.type.trim();

  const search = input.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { type: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (input.from || input.to) {
    where.createdAt = {};
    if (input.from) {
      const fromDate = new Date(input.from);
      if (Number.isNaN(fromDate.getTime())) {
        throw AppError.field('from', 'Invalid start date.', 400);
      }
      where.createdAt.gte = fromDate;
    }
    if (input.to) {
      const toDate = new Date(input.to);
      if (Number.isNaN(toDate.getTime())) {
        throw AppError.field('to', 'Invalid end date.', 400);
      }
      where.createdAt.lte = toDate;
    }
  }

  return where;
}

export async function logAdminActivity(input: LogActivityInput): Promise<void> {
  const meta = resolveMeta(input);

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

export async function getRecentAdminActivities(limit = 10) {
  const rows = await prisma.adminActivity.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return rows.map(toActivityDto);
}

export async function getAdminActivityById(id: string) {
  const activity = await prisma.adminActivity.findUnique({ where: { id } });
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
  const existing = await prisma.adminActivity.findUnique({
    where: { id },
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
    where: { id: { in: uniqueIds } },
  });

  if (result.count === 0) {
    throw new AppError('No matching activities were found to delete.', 404);
  }

  return {
    deletedCount: result.count,
    requestedCount: uniqueIds.length,
  };
}
