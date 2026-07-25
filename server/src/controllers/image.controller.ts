import type { NextFunction, Request, Response } from 'express';
import {
  removeMenuItemImage,
  removeRestaurantCover,
  removeRestaurantLogo,
  requireUploadedFile,
  uploadMenuItemImage,
  uploadRestaurantCover,
  uploadRestaurantLogo,
} from '../services/image.service.js';

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
