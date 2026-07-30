import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { logAdminActivity } from './activity.service.js';
import { getMenuItemById, type MenuItemResponse } from './menuItem.service.js';
import { getRestaurant, type RestaurantResponse } from './restaurant.service.js';
import { deleteStoredImage, processAndStoreImage } from './storage.service.js';

export async function uploadMenuItemImage(
  itemId: string,
  file: Express.Multer.File,
): Promise<MenuItemResponse> {
  const existing = await getMenuItemById(itemId);
  const publicPath = await processAndStoreImage(file, 'menuItem');

  try {
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { image: publicPath },
    });

    await deleteStoredImage(existing.image);

    await logAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.MENU_ITEM,
      entityId: itemId,
      summary: `Updated image for menu item "${existing.name}"`,
      type: 'MENU_ITEM_IMAGE_UPDATED',
      title: 'Menu item photo updated',
    });

    return getMenuItemById(itemId);
  } catch (error) {
    await deleteStoredImage(publicPath);
    throw error;
  }
}

export async function removeMenuItemImage(itemId: string): Promise<MenuItemResponse> {
  const existing = await getMenuItemById(itemId);

  if (!existing.image) {
    return existing;
  }

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { image: null },
  });

  await deleteStoredImage(existing.image);

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.MENU_ITEM,
    entityId: itemId,
    summary: `Removed image for menu item "${existing.name}"`,
    type: 'MENU_ITEM_IMAGE_REMOVED',
    title: 'Menu item photo removed',
  });

  return getMenuItemById(itemId);
}

export async function uploadRestaurantLogo(file: Express.Multer.File): Promise<RestaurantResponse> {
  const existing = await getRestaurant();
  const publicPath = await processAndStoreImage(file, 'logo');

  try {
    await prisma.restaurant.update({
      where: { id: existing.id },
      data: { logo: publicPath },
    });

    await deleteStoredImage(existing.logo);

    await logAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.RESTAURANT,
      entityId: existing.id,
      summary: 'Updated restaurant logo',
      type: 'RESTAURANT_LOGO_UPDATED',
      title: 'Logo updated',
    });

    return getRestaurant();
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

  await deleteStoredImage(existing.logo);

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.RESTAURANT,
    entityId: existing.id,
    summary: 'Removed restaurant logo',
    type: 'RESTAURANT_LOGO_REMOVED',
    title: 'Logo removed',
  });

  return getRestaurant();
}

export async function uploadRestaurantCover(file: Express.Multer.File): Promise<RestaurantResponse> {
  const existing = await getRestaurant();
  const publicPath = await processAndStoreImage(file, 'cover');

  try {
    await prisma.restaurant.update({
      where: { id: existing.id },
      data: { coverImage: publicPath },
    });

    await deleteStoredImage(existing.coverImage);

    await logAdminActivity({
      action: AdminAction.UPDATE,
      entity: AdminEntity.RESTAURANT,
      entityId: existing.id,
      summary: 'Updated restaurant cover image',
      type: 'RESTAURANT_COVER_UPDATED',
      title: 'Cover image updated',
    });

    return getRestaurant();
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

  await deleteStoredImage(existing.coverImage);

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.RESTAURANT,
    entityId: existing.id,
    summary: 'Removed restaurant cover image',
    type: 'RESTAURANT_COVER_REMOVED',
    title: 'Cover image removed',
  });

  return getRestaurant();
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
