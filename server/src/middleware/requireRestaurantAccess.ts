import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

const restaurantSelect = {
  id: true,
  slug: true,
  publicMenuToken: true,
  ownerId: true,
  name: true,
} as const;

/**
 * Ensures the authenticated owner owns the restaurant identified by :restaurantSlug.
 * Attach the restaurant context to the request for downstream handlers.
 */
export async function requireRestaurantAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.owner) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const slugParam = req.params.restaurantSlug;
    const slug = typeof slugParam === 'string' ? slugParam.trim().toLowerCase() : '';

    if (!slug) {
      next(new AppError('Restaurant not found', 404));
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug },
      select: restaurantSelect,
    });

    if (!restaurant) {
      next(new AppError('Restaurant not found', 404));
      return;
    }

    if (restaurant.ownerId !== req.owner.sub) {
      next(
        new AppError(
          'You do not have permission to access this restaurant workspace.',
          403,
        ),
      );
      return;
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Legacy `/api/admin/*` compatibility — resolve the owner's restaurant without a slug.
 * Prefer `/api/r/:restaurantSlug/*` for new clients.
 */
export async function requireOwnerRestaurant(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.owner) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: req.owner.sub },
      select: restaurantSelect,
    });

    if (!restaurant) {
      next(new AppError('Restaurant profile has not been configured', 404));
      return;
    }

    req.restaurant = restaurant;
    next();
  } catch (error) {
    next(error);
  }
}
