import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

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
      select: {
        id: true,
        slug: true,
        publicMenuToken: true,
        ownerId: true,
        name: true,
      },
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
