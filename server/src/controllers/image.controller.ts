import type { NextFunction, Request, Response } from 'express';
import {
  attachMenuItemImageUrl,
  attachRestaurantCoverUrl,
  attachRestaurantLogoUrl,
  removeMenuItemImage,
  removeRestaurantCover,
  removeRestaurantLogo,
  requireUploadedFile,
  uploadMenuItemImage,
  uploadRestaurantCover,
  uploadRestaurantLogo,
} from '../services/image.service.js';
import {
  assertOwnedCloudinaryUrl,
  createCloudinaryUploadSign,
} from '../services/cloudinarySign.service.js';
import type { CloudinarySignInput } from '../services/cloudinarySign.service.js';

export async function signCloudinaryUploadHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as CloudinarySignInput;
    const sign = createCloudinaryUploadSign(body.variant);

    res.status(200).json({
      success: true,
      message: 'Cloudinary upload signature created',
      data: sign,
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadMenuItemImageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = requireUploadedFile(req.file);
    const item = await uploadMenuItemImage(req.params.id as string, file);

    res.status(200).json({
      success: true,
      message: 'Menu item image uploaded',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function attachMenuItemImageUrlHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const imageUrl = assertOwnedCloudinaryUrl(String((req.body as { imageUrl?: string }).imageUrl ?? ''));
    const item = await attachMenuItemImageUrl(req.params.id as string, imageUrl);

    res.status(200).json({
      success: true,
      message: 'Menu item image uploaded',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeMenuItemImageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const item = await removeMenuItemImage(req.params.id as string);

    res.status(200).json({
      success: true,
      message: 'Menu item image removed',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadRestaurantLogoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = requireUploadedFile(req.file);
    const restaurant = await uploadRestaurantLogo(file);

    res.status(200).json({
      success: true,
      message: 'Restaurant logo uploaded',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function attachRestaurantLogoUrlHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const imageUrl = assertOwnedCloudinaryUrl(String((req.body as { imageUrl?: string }).imageUrl ?? ''));
    const restaurant = await attachRestaurantLogoUrl(imageUrl);

    res.status(200).json({
      success: true,
      message: 'Restaurant logo uploaded',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeRestaurantLogoHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await removeRestaurantLogo();

    res.status(200).json({
      success: true,
      message: 'Restaurant logo removed',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadRestaurantCoverHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = requireUploadedFile(req.file);
    const restaurant = await uploadRestaurantCover(file);

    res.status(200).json({
      success: true,
      message: 'Restaurant cover image uploaded',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function attachRestaurantCoverUrlHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const imageUrl = assertOwnedCloudinaryUrl(String((req.body as { imageUrl?: string }).imageUrl ?? ''));
    const restaurant = await attachRestaurantCoverUrl(imageUrl);

    res.status(200).json({
      success: true,
      message: 'Restaurant cover image uploaded',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}

export async function removeRestaurantCoverHandler(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const restaurant = await removeRestaurantCover();

    res.status(200).json({
      success: true,
      message: 'Restaurant cover image removed',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
}
