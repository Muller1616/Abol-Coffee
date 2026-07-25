import type { NextFunction, Request, Response } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  reorderCategories,
  updateCategory,
  updateCategoryStatus,
} from '../services/category.service.js';
import type {
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from '../validators/category.validators.js';

export async function listCategoriesHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const categories = await listCategories();

    res.status(200).json({
      success: true,
      message: 'Categories retrieved',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const category = await getCategoryById(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Category retrieved',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as CreateCategoryInput;
    const category = await createCategory(body);

    res.status(201).json({
      success: true,
      message: 'Category created',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateCategoryInput;
    const category = await updateCategory(req.params.id as string, body);

    res.status(200).json({
      success: true,
      message: 'Category updated',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateCategoryStatusInput;
    const category = await updateCategoryStatus(req.params.id as string, body);

    res.status(200).json({
      success: true,
      message: 'Category status updated',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteCategory(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Category deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderCategoriesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ReorderCategoriesInput;
    const categories = await reorderCategories(body);

    res.status(200).json({
      success: true,
      message: 'Categories reordered',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}
