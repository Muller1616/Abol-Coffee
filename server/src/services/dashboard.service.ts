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
    type: string;
    title: string;
    entityId: string | null;
    summary: string;
    createdAt: string;
  }>;
};

type AggregateRow = {
  total_categories: bigint | number;
  total_menu_items: bigint | number;
  available_items: bigint | number;
  last_updated: Date | null;
};

function toNumber(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

export async function getDashboard(recentLimit = 5): Promise<DashboardResponse> {
  const [restaurant, aggregates, recentUpdates] = await Promise.all([
    prisma.restaurant.findFirst({
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
    }),
    prisma.$queryRaw<AggregateRow[]>`
      SELECT
        (SELECT COUNT(*)::int FROM categories) AS total_categories,
        (SELECT COUNT(*)::int FROM menu_items) AS total_menu_items,
        (SELECT COUNT(*)::int FROM menu_items WHERE "isAvailable" = true) AS available_items,
        (
          SELECT GREATEST(
            (SELECT MAX("updatedAt") FROM categories),
            (SELECT MAX("updatedAt") FROM menu_items),
            (SELECT MAX("updatedAt") FROM restaurants)
          )
        ) AS last_updated
    `,
    getRecentAdminActivities(recentLimit),
  ]);

  if (!restaurant) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  const row = aggregates[0];
  const totalCategories = toNumber(row?.total_categories ?? 0);
  const totalMenuItems = toNumber(row?.total_menu_items ?? 0);
  const availableItems = toNumber(row?.available_items ?? 0);
  const lastUpdated = row?.last_updated ?? null;

  return {
    stats: {
      totalCategories,
      totalMenuItems,
      availableItems,
      hiddenItems: totalMenuItems - availableItems,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
      restaurantStatus: restaurant.status,
    },
    restaurant,
    recentUpdates,
  };
}
