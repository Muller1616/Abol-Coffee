import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity, type Restaurant } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { parseOpeningHours, toOpeningHoursJson } from '../utils/openingHours.js';
import type {
  UpdateRestaurantInput,
  UpdateRestaurantStatusInput,
} from '../validators/restaurant.validators.js';
import { queueAdminActivity } from './activity.service.js';
import { invalidatePublicMenuCache } from './publicMenu.cache.js';

export type RestaurantResponse = Omit<Restaurant, 'openingHours'> & {
  openingHours: ReturnType<typeof parseOpeningHours>;
};

function toRestaurantResponse(restaurant: Restaurant): RestaurantResponse {
  return {
    ...restaurant,
    openingHours: parseOpeningHours(restaurant.openingHours),
  };
}

export async function getRestaurantForOwner(ownerId: string): Promise<RestaurantResponse> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  if (!restaurant) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  return toRestaurantResponse(restaurant);
}

/** @deprecated Prefer getRestaurantForOwner — kept for scripts that assume single-tenant. */
export async function getRestaurant(): Promise<RestaurantResponse> {
  const restaurant = await prisma.restaurant.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!restaurant) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  return toRestaurantResponse(restaurant);
}

export async function updateRestaurantForOwner(
  ownerId: string,
  input: UpdateRestaurantInput,
): Promise<RestaurantResponse> {
  const existing = await prisma.restaurant.findUnique({
    where: { ownerId },
  });

  if (!existing) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  const updated = await prisma.restaurant.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.logo !== undefined ? { logo: input.logo } : {}),
      ...(input.coverImage !== undefined ? { coverImage: input.coverImage } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.facebook !== undefined ? { facebook: input.facebook } : {}),
      ...(input.instagram !== undefined ? { instagram: input.instagram } : {}),
      ...(input.telegram !== undefined ? { telegram: input.telegram } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.openingHours !== undefined
        ? { openingHours: toOpeningHoursJson(input.openingHours) }
        : {}),
    },
  });

  queueAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.RESTAURANT,
    entityId: updated.id,
    summary: buildUpdateSummary(input),
  });

  invalidatePublicMenuCache();
  return toRestaurantResponse(updated);
}

export async function updateRestaurant(input: UpdateRestaurantInput): Promise<RestaurantResponse> {
  const existing = await prisma.restaurant.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!existing) {
    throw new AppError('Restaurant profile has not been configured', 404);
  }

  return updateRestaurantForOwner(existing.ownerId, input);
}

export async function updateRestaurantStatusForOwner(
  ownerId: string,
  input: UpdateRestaurantStatusInput,
): Promise<RestaurantResponse> {
  return updateRestaurantForOwner(ownerId, { status: input.status });
}

export async function updateRestaurantStatus(
  input: UpdateRestaurantStatusInput,
): Promise<RestaurantResponse> {
  return updateRestaurant({ status: input.status });
}

function buildUpdateSummary(input: UpdateRestaurantInput): string {
  const fields = Object.keys(input);

  if (fields.length === 1 && fields[0] === 'status') {
    return `Restaurant status set to ${input.status}`;
  }

  return `Updated restaurant information (${fields.join(', ')})`;
}
