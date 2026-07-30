import type { NextFunction, Request, Response } from 'express';
import {
  getRestaurantForOwner,
  updateRestaurantForOwner,
  updateRestaurantStatusForOwner,
} from '../services/restaurant.service.js';
import { AppError } from '../utils/AppError.js';
import type {
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
} from '../validators/restaurant.validators.js';

function requireOwnerId(req: Request): string {
  if (!req.owner?.sub) {
    throw new AppError('Authentication required', 401);
  }
  return req.owner.sub;
}

export async function getRestaurantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await getRestaurantForOwner(requireOwnerId(req));

    res.status(200).json({
      success: true,
      message: 'Restaurant profile retrieved',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurantHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateRestaurantInput;
    const restaurant = await updateRestaurantForOwner(requireOwnerId(req), body);

    res.status(200).json({
      success: true,
      message: 'Restaurant profile updated',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRestaurantStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as UpdateRestaurantStatusInput;
    const restaurant = await updateRestaurantStatusForOwner(requireOwnerId(req), body);

    res.status(200).json({
      success: true,
      message: 'Restaurant status updated',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}
