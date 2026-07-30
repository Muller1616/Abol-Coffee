import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity, Prisma } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { handlePrismaError } from '../utils/prismaErrors.js';
import type {
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from '../validators/category.validators.js';
import { queueAdminActivity } from './activity.service.js';
import { invalidatePublicMenuCache } from './publicMenu.cache.js';

const categoryInclude = {
  _count: {
    select: { menuItems: true },
  },
} satisfies Prisma.CategoryInclude;

export type CategoryWithCount = Prisma.CategoryGetPayload<{ include: typeof categoryInclude }>;

export async function listCategories(): Promise<CategoryWithCount[]> {
  return prisma.category.findMany({
    include: categoryInclude,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getCategoryById(id: string): Promise<CategoryWithCount> {
  const category = await prisma.category.findUnique({
    where: { id },
    include: categoryInclude,
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
}

export async function createCategory(input: CreateCategoryInput): Promise<CategoryWithCount> {
  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      },
      include: categoryInclude,
    });

    queueAdminActivity({
      action: AdminAction.CREATE,
      entity: AdminEntity.CATEGORY,
      entityId: category.id,
      summary: `Created category "${category.name}"`,
    });

    invalidatePublicMenuCache();
    return category;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.field('name', 'Category already exists. Please choose a different name.', 409);
    }

    handlePrismaError(error, 'Failed to create category');
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryWithCount> {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: categoryInclude,
    });

    queueAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.CATEGORY,
      entityId: category.id,
      summary: `Updated category "${category.name}"`,
    });

    invalidatePublicMenuCache();
    return category;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.field('name', 'Category already exists. Please choose a different name.', 409);
    }

    handlePrismaError(error, 'Failed to update category');
  }
}

export async function updateCategoryStatus(
  id: string,
  input: UpdateCategoryStatusInput,
): Promise<CategoryWithCount> {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: input.isActive },
      include: categoryInclude,
    });

    queueAdminActivity({
      action: AdminAction.TOGGLE,
      entity: AdminEntity.CATEGORY,
      entityId: category.id,
      summary: `Category "${category.name}" ${input.isActive ? 'enabled' : 'disabled'}`,
    });

    invalidatePublicMenuCache();
    return category;
  } catch (error) {
    handlePrismaError(error, 'Failed to update category status');
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      _count: { select: { menuItems: true } },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category._count.menuItems > 0) {
    throw new AppError(
      `Category cannot be deleted while it contains ${category._count.menuItems} menu item${
        category._count.menuItems === 1 ? '' : 's'
      }. Move or delete those items first.`,
      400,
    );
  }

  await prisma.category.delete({ where: { id } });

  queueAdminActivity({
    action: AdminAction.DELETE,
    entity: AdminEntity.CATEGORY,
    entityId: id,
    summary: `Deleted category "${category.name}"`,
  });

  invalidatePublicMenuCache();
}

export async function reorderCategories(
  input: ReorderCategoriesInput,
): Promise<CategoryWithCount[]> {
  const ids = input.items.map((item) => item.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new AppError('Duplicate category ids are not allowed in reorder payload', 400);
  }

  try {
    await prisma.$transaction(
      input.items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );
  } catch (error) {
    handlePrismaError(error, 'Failed to reorder categories');
  }

  queueAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.CATEGORY,
    summary: `Reordered ${input.items.length} categories`,
  });

  invalidatePublicMenuCache();
  return listCategories();
}
