import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { queueAdminActivity } from './activity.service.js';
import {
  menuItemInclude,
  toMenuItemResponse,
  type MenuItemResponse,
} from './menuItem.service.js';
import { invalidatePublicMenuCache } from './publicMenu.cache.js';
import { getRestaurant, type RestaurantResponse } from './restaurant.service.js';
import { deleteStoredImage, processAndStoreImage } from './storage.service.js';

export async function uploadMenuItemImage(
  itemId: string,
  file: Express.Multer.File,
): Promise<MenuItemResponse> {
  const existing = await prisma.menuItem.findUnique({
    where: { id: itemId },
    select: { id: true, name: true, image: true },
  });

  if (!existing) {
    throw new AppError('Menu item not found', 404);
  }

  const publicPath = await processAndStoreImage(file, 'menuItem');

  try {
    const updated = await prisma.menuItem.update({
      where: { id: itemId },
      data: { image: publicPath },
      include: menuItemInclude,
    });

    void deleteStoredImage(existing.image);

    queueAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.MENU_ITEM,
      entityId: itemId,
      summary: `Updated image for menu item "${existing.name}"`,
      type: 'MENU_ITEM_IMAGE_UPDATED',
      title: 'Menu item photo updated',
    });

    invalidatePublicMenuCache();
    return toMenuItemResponse(updated);
  } catch (error) {
    await deleteStoredImage(publicPath);
    throw error;
  }
}

export async function removeMenuItemImage(itemId: string): Promise<MenuItemResponse> {
  const existing = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: menuItemInclude,
  });

  if (!existing) {
    throw new AppError('Menu item not found', 404);
  }

  if (!existing.image) {
    return toMenuItemResponse(existing);
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: { image: null },
    include: menuItemInclude,
  });

  void deleteStoredImage(existing.image);

  queueAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.MENU_ITEM,
    entityId: itemId,
    summary: `Removed image for menu item "${existing.name}"`,
    type: 'MENU_ITEM_IMAGE_REMOVED',
    title: 'Menu item photo removed',
  });

  invalidatePublicMenuCache();
  return toMenuItemResponse(updated);
}

export async function uploadRestaurantLogo(file: Express.Multer.File): Promise<RestaurantResponse> {
  const existing = await getRestaurant();
  const publicPath = await processAndStoreImage(file, 'logo');

  try {
    await prisma.restaurant.update({
      where: { id: existing.id },
      data: { logo: publicPath },
    });

    void deleteStoredImage(existing.logo);

    queueAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.RESTAURANT,
      entityId: existing.id,
      summary: 'Updated restaurant logo',
      type: 'RESTAURANT_LOGO_UPDATED',
      title: 'Logo updated',
    });

    invalidatePublicMenuCache();
    return { ...existing, logo: publicPath };
  } catch (error) {
    await deleteStoredImage(publicPath);
    throw error;
  }
}

export async function removeRestaurantLogo(): Promise<RestaurantResponse> {
  const existing = await getRestaurant();

  if (!existing.logo) {
    return existing;
  }

  await prisma.restaurant.update({
    where: { id: existing.id },
    data: { logo: null },
  });

  void deleteStoredImage(existing.logo);

  queueAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.RESTAURANT,
    entityId: existing.id,
    summary: 'Removed restaurant logo',
    type: 'RESTAURANT_LOGO_REMOVED',
    title: 'Logo removed',
  });

  invalidatePublicMenuCache();
  return { ...existing, logo: null };
}

export async function uploadRestaurantCover(file: Express.Multer.File): Promise<RestaurantResponse> {
  const existing = await getRestaurant();
  const publicPath = await processAndStoreImage(file, 'cover');

  try {
    await prisma.restaurant.update({
      where: { id: existing.id },
      data: { coverImage: publicPath },
    });

    void deleteStoredImage(existing.coverImage);

    queueAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.RESTAURANT,
      entityId: existing.id,
      summary: 'Updated restaurant cover image',
      type: 'RESTAURANT_COVER_UPDATED',
      title: 'Cover image updated',
    });

    invalidatePublicMenuCache();
    return { ...existing, coverImage: publicPath };
  } catch (error) {
    await deleteStoredImage(publicPath);
    throw error;
  }
}

export async function removeRestaurantCover(): Promise<RestaurantResponse> {
  const existing = await getRestaurant();

  if (!existing.coverImage) {
    return existing;
  }

  await prisma.restaurant.update({
    where: { id: existing.id },
    data: { coverImage: null },
  });

  void deleteStoredImage(existing.coverImage);

  queueAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.RESTAURANT,
    entityId: existing.id,
    summary: 'Removed restaurant cover image',
    type: 'RESTAURANT_COVER_REMOVED',
    title: 'Cover image removed',
  });

  invalidatePublicMenuCache();
  return { ...existing, coverImage: null };
}

export function requireUploadedFile(file: Express.Multer.File | undefined): Express.Multer.File {
  if (!file) {
    throw AppError.field(
      'image',
      'Image file is required. Please select an image to upload.',
    );
  }

  return file;
}
