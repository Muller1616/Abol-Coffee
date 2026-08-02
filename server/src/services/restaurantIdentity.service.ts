import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { generatePublicMenuToken } from '../utils/restaurantIdentity.js';
import { invalidatePublicMenuCache } from './publicMenu.cache.js';

/** Public web origin used to build permanent menu URLs (path from PUBLIC_MENU_URL is ignored). */
export function getPublicAppOrigin(): string {
  const raw = env.PUBLIC_MENU_URL?.trim() || env.CLIENT_URL;
  const url = new URL(raw);
  return url.origin.replace(/\/$/, '');
}

/**
 * True when the configured public origin is unsuitable for printed table QR codes
 * (localhost, loopback, or plain HTTP).
 */
export function isNonPrintablePublicOrigin(origin = getPublicAppOrigin()): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    const isLoopback =
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    return isLoopback || protocol !== 'https:';
  } catch {
    return true;
  }
}

export function assertPrintablePublicMenuOrigin(): void {
  if (!isNonPrintablePublicOrigin()) return;
  throw new AppError(
    'QR download/print is blocked until PUBLIC_MENU_URL uses a permanent HTTPS production domain. Local/dev URLs must not be printed for restaurant tables.',
    409,
  );
}

export function buildPublicMenuUrl(publicMenuToken: string): string {
  return `${getPublicAppOrigin()}/menu/${publicMenuToken}`;
}

export async function getRestaurantPublicIdentity(restaurantId?: string) {
  const restaurant = restaurantId
    ? await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, slug: true, publicMenuToken: true, name: true, ownerId: true },
      })
    : await prisma.restaurant.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true, slug: true, publicMenuToken: true, name: true, ownerId: true },
      });

  if (!restaurant) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  return restaurant;
}

export async function getRestaurantByOwnerId(ownerId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
    select: {
      id: true,
      slug: true,
      publicMenuToken: true,
      name: true,
      ownerId: true,
    },
  });

  if (!restaurant) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  return restaurant;
}

export async function getRestaurantBySlug(slug: string) {
  return prisma.restaurant.findUnique({
    where: { slug: slug.trim().toLowerCase() },
    select: {
      id: true,
      slug: true,
      publicMenuToken: true,
      name: true,
      ownerId: true,
    },
  });
}

export async function getRestaurantByPublicMenuToken(token: string) {
  return prisma.restaurant.findUnique({
    where: { publicMenuToken: token },
    select: {
      id: true,
      slug: true,
      publicMenuToken: true,
      name: true,
      ownerId: true,
      status: true,
    },
  });
}

/**
 * Explicit owner action only — rotating the token invalidates previously printed QR codes.
 */
export async function regeneratePublicMenuToken(restaurantId: string) {
  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { publicMenuToken: generatePublicMenuToken() },
    select: {
      id: true,
      slug: true,
      publicMenuToken: true,
      name: true,
      ownerId: true,
    },
  });

  invalidatePublicMenuCache();
  return updated;
}
