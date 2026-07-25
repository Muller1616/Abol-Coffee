import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { getRecentAdminActivities } from './activity.service.js';

export type DashboardResponse = {
  stats: {
    totalCategories: number;
    totalMenuItems: number;
    availableItems: number;
    hiddenItems: number;
    lastUpdated: string | null;
    restaurantStatus: 'ACTIVE' | 'MAINTENANCE';
  };
  restaurant: {
    id: string;
    name: string;
    logo: string | null;
    coverImage: string | null;
    status: 'ACTIVE' | 'MAINTENANCE';
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  recentUpdates: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    summary: string;
    createdAt: string;
  }>;
};

async function getLastUpdatedAt(): Promise<Date | null> {
  const [category, menuItem, restaurant] = await Promise.all([
    prisma.category.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.menuItem.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.restaurant.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ]);

  const timestamps = [category?.updatedAt, menuItem?.updatedAt, restaurant?.updatedAt].filter(
    (value): value is Date => value instanceof Date,
  );

  if (timestamps.length === 0) {
    return null;
  }

  return timestamps.reduce((latest, current) => (current > latest ? current : latest));
}

export async function getDashboard(recentLimit = 10): Promise<DashboardResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      logo: true,
      coverImage: true,
      status: true,
      phone: true,
      email: true,
      address: true,
    },
  });

  if (!restaurant) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  const [totalCategories, totalMenuItems, availableItems, lastUpdated, recentUpdates] =
    await Promise.all([
      prisma.category.count(),
      prisma.menuItem.count(),
      prisma.menuItem.count({ where: { isAvailable: true } }),
      getLastUpdatedAt(),
      getRecentAdminActivities(recentLimit),
    ]);

  const hiddenItems = totalMenuItems - availableItems;

  return {
    stats: {
      totalCategories,
      totalMenuItems,
      availableItems,
      hiddenItems,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
      restaurantStatus: restaurant.status,
    },
    restaurant,
    recentUpdates: recentUpdates.map((activity) => ({
      id: activity.id,
      action: activity.action,
      entity: activity.entity,
      entityId: activity.entityId,
      summary: activity.summary,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}
