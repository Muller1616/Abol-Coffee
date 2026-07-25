import type { NextFunction, Request, Response } from 'express';
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  listMenuItems,
  reorderMenuItems,
  updateMenuItem,
  updateMenuItemAvailability,
} from '../services/menuItem.service.js';
import type {
  CreateMenuItemInput,
  ListMenuItemsQuery,
  ReorderMenuItemsInput,
  UpdateMenuItemAvailabilityInput,
  UpdateMenuItemInput,
} from '../validators/menuItem.validators.js';

export async function listMenuItemsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as ListMenuItemsQuery;
    const result = await listMenuItems(query);

    res.status(200).json({
      success: true,
      message: 'Menu items retrieved',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMenuItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await getMenuItemById(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Menu item retrieved',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function createMenuItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as CreateMenuItemInput;
    const item = await createMenuItem(body);

    res.status(201).json({
      success: true,
      message: 'Menu item created',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMenuItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateMenuItemInput;
    const item = await updateMenuItem(req.params.id as string, body);

    res.status(200).json({
      success: true,
      message: 'Menu item updated',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMenuItemAvailabilityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateMenuItemAvailabilityInput;
    const item = await updateMenuItemAvailability(req.params.id as string, body);

    res.status(200).json({
      success: true,
      message: 'Menu item availability updated',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteMenuItem(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Menu item deleted',
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderMenuItemsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ReorderMenuItemsInput;
    const items = await reorderMenuItems(body);

    res.status(200).json({
      success: true,
      message: 'Menu items reordered',
      data: { items },
    });
  } catch (error) {
    next(error);
  }
}
