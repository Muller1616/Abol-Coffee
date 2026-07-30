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
import { logAdminActivity } from './activity.service.js';
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

function toMenuItemResponse(item: MenuItemRecord): MenuItemResponse {
  return {
    ...item,
    price: toMoneyNumber(item.price),
    priceFormatted: formatMoney(item.price),
    currency: 'ETB',
  };
}

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
  await assertCategoryExists(input.categoryId);

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
        displayOrder: input.displayOrder,
      },
      include: menuItemInclude,
    });

    await logAdminActivity({
      action: AdminAction.CREATE,
      entity: AdminEntity.MENU_ITEM,
      entityId: item.id,
      summary: `Created menu item "${item.name}" (${formatMoney(item.price)} ETB)`,
    });

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
  await getMenuItemById(id);

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

    const summary =
      input.price !== undefined && Object.keys(input).length === 1
        ? `Updated price for "${item.name}" to ${formatMoney(item.price)} ETB`
        : `Updated menu item "${item.name}"`;

    await logAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.MENU_ITEM,
      entityId: item.id,
      summary,
    });

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
  await getMenuItemById(id);

  const item = await prisma.menuItem.update({
    where: { id },
    data: { isAvailable: input.isAvailable },
    include: menuItemInclude,
  });

  await logAdminActivity({
    action: AdminAction.TOGGLE,
    entity: AdminEntity.MENU_ITEM,
    entityId: item.id,
    summary: `Menu item "${item.name}" marked as ${input.isAvailable ? 'available' : 'hidden'}`,
  });

  return toMenuItemResponse(item);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const item = await getMenuItemById(id);

  await prisma.menuItem.delete({ where: { id } });
  await deleteStoredImage(item.image);

  await logAdminActivity({
    action: AdminAction.DELETE,
    entity: AdminEntity.MENU_ITEM,
    entityId: id,
    summary: `Deleted menu item "${item.name}"`,
  });
}

export async function reorderMenuItems(input: ReorderMenuItemsInput): Promise<MenuItemResponse[]> {
  const ids = input.items.map((item) => item.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new AppError('Duplicate menu item ids are not allowed in reorder payload', 400);
  }

  const existingCount = await prisma.menuItem.count({
    where: { id: { in: ids } },
  });

  if (existingCount !== ids.length) {
    throw new AppError('One or more menu items were not found', 404);
  }

  await prisma.$transaction(
    input.items.map((item) =>
      prisma.menuItem.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      }),
    ),
  );

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.MENU_ITEM,
    summary: `Reordered ${input.items.length} menu items`,
  });

  const items = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
    include: menuItemInclude,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });

  return items.map(toMenuItemResponse);
}
