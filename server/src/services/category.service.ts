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
import { logAdminActivity } from './activity.service.js';

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
  const duplicate = await prisma.category.findFirst({
    where: {
      name: { equals: input.name, mode: 'insensitive' },
    },
    select: { id: true },
  });

  if (duplicate) {
    throw AppError.field('name', 'Category already exists. Please choose a different name.', 409);
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
      },
      include: categoryInclude,
    });

    await logAdminActivity({
      action: AdminAction.CREATE,
      entity: AdminEntity.CATEGORY,
      entityId: category.id,
      summary: `Created category "${category.name}"`,
    });

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
  await getCategoryById(id);

  if (input.name !== undefined) {
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: { equals: input.name, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw AppError.field('name', 'Category already exists. Please choose a different name.', 409);
    }
  }

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

    await logAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.CATEGORY,
      entityId: category.id,
      summary: `Updated category "${category.name}"`,
    });

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
  await getCategoryById(id);

  const category = await prisma.category.update({
    where: { id },
    data: { isActive: input.isActive },
    include: categoryInclude,
  });

  await logAdminActivity({
    action: AdminAction.TOGGLE,
    entity: AdminEntity.CATEGORY,
    entityId: category.id,
    summary: `Category "${category.name}" ${input.isActive ? 'enabled' : 'disabled'}`,
  });

  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await getCategoryById(id);

  if (category._count.menuItems > 0) {
    throw new AppError(
      `Category cannot be deleted while it contains ${category._count.menuItems} menu item${
        category._count.menuItems === 1 ? '' : 's'
      }. Move or delete those items first.`,
      400,
    );
  }

  await prisma.category.delete({ where: { id } });

  await logAdminActivity({
    action: AdminAction.DELETE,
    entity: AdminEntity.CATEGORY,
    entityId: id,
    summary: `Deleted category "${category.name}"`,
  });
}

export async function reorderCategories(
  input: ReorderCategoriesInput,
): Promise<CategoryWithCount[]> {
  const ids = input.items.map((item) => item.id);
  const uniqueIds = new Set(ids);

  if (uniqueIds.size !== ids.length) {
    throw new AppError('Duplicate category ids are not allowed in reorder payload', 400);
  }

  const existingCount = await prisma.category.count({
    where: { id: { in: ids } },
  });

  if (existingCount !== ids.length) {
    throw new AppError('One or more categories were not found', 404);
  }

  await prisma.$transaction(
    input.items.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { displayOrder: item.displayOrder },
      }),
    ),
  );

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.CATEGORY,
    summary: `Reordered ${input.items.length} categories`,
  });

  return listCategories();
}
