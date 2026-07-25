import type { NextFunction, Request, Response } from 'express';
import { getPublicMenu } from '../services/publicMenu.service.js';
import type { PublicMenuQuery } from '../validators/publicMenu.validators.js';

export async function getPublicMenuHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as PublicMenuQuery;
    const menu = await getPublicMenu(query ?? {});

    if (menu.status === 'MAINTENANCE') {
      res.status(503).json({
        success: false,
        message: menu.message,
        data: menu,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Public menu retrieved',
      data: menu,
    });
  } catch (error) {
    next(error);
  }
}
