import type { NextFunction, Request, Response } from 'express';
import { buildPublicMenuUrl, getRestaurantPublicIdentity } from '../services/restaurantIdentity.service.js';

/** Unauthenticated helper for marketing links — single-tenant public menu entry. */
export async function getPublicMenuEntryHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await getRestaurantPublicIdentity();
    const menuUrl = buildPublicMenuUrl(restaurant.publicMenuToken);

    res.status(200).json({
      success: true,
      message: 'Public menu entry retrieved',
      data: {
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
        publicMenuToken: restaurant.publicMenuToken,
        menuUrl,
        menuPath: `/menu/${restaurant.publicMenuToken}`,
      },
    });
  } catch (error) {
    next(error);
  }
}
