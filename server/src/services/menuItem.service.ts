import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity, Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { formatMoney, toMoneyNumber } from '../utils/money.js';
import { handlePrismaError } from '../utils/prismaErrors.js';
import type {
  CreateMenuItemInput,
  ListMenuItemsQuery,
  ReorderMenuItemsInput,
  UpdateMenuItemAvailabilityInput,
  UpdateMenuItemInput,
} from '../validators/menuItem.validators.js';
import { queueAdminActivity } from './activity.service.js';
import { invalidatePublicMenuCache } from './publicMenu.cache.js';
import { deleteStoredImage } from './storage.service.js';

const menuItemInclude = {
  category: {
    select: {
      id: true,
      name: true,
      isActive: true,
    },
  },
} satisfies Prisma.MenuItemInclude;

type MenuItemRecord = Prisma.MenuItemGetPayload<{ include: typeof menuItemInclude }>;

export type MenuItemResponse = Omit<MenuItemRecord, 'price'> & {
  price: number;
  priceFormatted: string;
  currency: 'ETB';
};

export type PaginatedMenuItems = {
  items: MenuItemResponse[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function toMenuItemResponse(item: MenuItemRecord): MenuItemResponse {
  return {
    ...item,
    price: toMoneyNumber(item.price),
    priceFormatted: formatMoney(item.price),
    currency: 'ETB',
  };
}

export { menuItemInclude };

async function assertCategoryExists(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }
}

export async function listMenuItems(query: ListMenuItemsQuery): Promise<PaginatedMenuItems> {
  const where: Prisma.MenuItemWhereInput = {
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.isAvailable !== undefined ? { isAvailable: query.isAvailable } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const skip = (query.page - 1) * query.pageSize;

  const [total, items] = await prisma.$transaction([
    prisma.menuItem.count({ where }),
    prisma.menuItem.findMany({
      where,
      include: menuItemInclude,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: items.map(toMenuItemResponse),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
    },
  };
}

export async function getMenuItemById(id: string): Promise<MenuItemResponse> {
  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: menuItemInclude,
  });

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  return toMenuItemResponse(item);
}

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItemResponse> {
  const [, maxOrder] = await Promise.all([
    assertCategoryExists(input.categoryId),
    prisma.menuItem.aggregate({
      where: { categoryId: input.categoryId },
      _max: { displayOrder: true },
    }),
  ]);

  const displayOrder = input.displayOrder ?? (maxOrder._max.displayOrder ?? -1) + 1;

  try {
    const item = await prisma.menuItem.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        description: input.description,
        price: input.price,
        currency: 'ETB',
        image: input.image ?? null,
        isAvailable: input.isAvailable,
        displayOrder,
      },
      include: menuItemInclude,
    });

    queueAdminActivity({
      action: AdminAction.CREATE,
      entity: AdminEntity.MENU_ITEM,
      entityId: item.id,
      summary: `Created menu item "${item.name}" (${formatMoney(item.price)} ETB)`,
    });

    invalidatePublicMenuCache();
    return toMenuItemResponse(item);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.field(
        'name',
        'A menu item with this name already exists in the category. Please choose a different name.',
        409,
      );
    }

    handlePrismaError(error, 'Failed to create menu item');
  }
}

export async function updateMenuItem(
  id: string,
  input: UpdateMenuItemInput,
): Promise<MenuItemResponse> {
  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        currency: 'ETB',
      },
      include: menuItemInclude,
    });

    const priceOnly = input.price !== undefined && Object.keys(input).length === 1;
    const summary = priceOnly
      ? `Updated price for "${item.name}" to ${formatMoney(item.price)} ETB`
      : `Updated menu item "${item.name}"`;

    queueAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.MENU_ITEM,
      entityId: item.id,
      summary,
      ...(priceOnly ? { type: 'MENU_ITEM_PRICE_UPDATED', title: 'Price updated' } : {}),
    });

    invalidatePublicMenuCache();
    return toMenuItemResponse(item);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.field(
        'name',
        'A menu item with this name already exists in the category. Please choose a different name.',
        409,
      );
    }

    handlePrismaError(error, 'Failed to update menu item');
  }
}

export async function updateMenuItemAvailability(
  id: string,
  input: UpdateMenuItemAvailabilityInput,
): Promise<MenuItemResponse> {
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: input.isAvailable },
      include: menuItemInclude,
    });

    queueAdminActivity({
      action: AdminAction.TOGGLE,
      entity: AdminEntity.MENU_ITEM,
      entityId: item.id,
      summary: `Menu item "${item.name}" marked as ${input.isAvailable ? 'available' : 'hidden'}`,
    });

    invalidatePublicMenuCache();
    return toMenuItemResponse(item);
  } catch (error) {
    handlePrismaError(error, 'Failed to update menu item availability');
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  const item = await prisma.menuItem.findUnique({
    where: { id },
    select: { id: true, name: true, image: true },
  });

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  await prisma.menuItem.delete({ where: { id } });

  // Disk cleanup must not block the API response.
  void deleteStoredImage(item.image);

  queueAdminActivity({
    action: AdminAction.DELETE,
    entity: AdminEntity.MENU_ITEM,
    entityId: id,
    summary: `Deleted menu item "${item.name}"`,
  });

  invalidatePublicMenuCache();
}

export async function reorderMenuItems(input: ReorderMenuItemsInput): Promise<MenuItemResponse[]> {
  const ids = input.items.map((item) => item.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new AppError('Duplicate menu item ids are not allowed in reorder payload', 400);
  }

  try {
    await prisma.$transaction(
      input.items.map((item) =>
        prisma.menuItem.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );
  } catch (error) {
    handlePrismaError(error, 'Failed to reorder menu items');
  }

  queueAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.MENU_ITEM,
    summary: `Reordered ${input.items.length} menu items`,
  });

  invalidatePublicMenuCache();

  const items = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
    include: menuItemInclude,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  return items.map(toMenuItemResponse);
}
