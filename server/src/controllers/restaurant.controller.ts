import type { NextFunction, Request, Response } from 'express';
import {
  getRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
} from '../services/restaurant.service.js';
import type {
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
} from '../validators/restaurant.validators.js';

export async function getRestaurantHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await getRestaurant();

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
    const restaurant = await updateRestaurant(body);

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
    const restaurant = await updateRestaurantStatus(body);

    res.status(200).json({
      success: true,
      message: 'Restaurant status updated',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}
