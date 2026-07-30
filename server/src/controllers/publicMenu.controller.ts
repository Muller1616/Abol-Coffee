import type { NextFunction, Request, Response } from 'express';
import {
  getCachedPublicMenuEntry,
  setCachedPublicMenu,
} from '../services/publicMenu.cache.js';
import { getPublicMenu } from '../services/publicMenu.service.js';
import type { PublicMenuQuery } from '../validators/publicMenu.validators.js';

export async function getPublicMenuHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = (req.validatedQuery as PublicMenuQuery) ?? {};

    let entry = getCachedPublicMenuEntry(query.search, query.categoryId);
    if (!entry) {
      const menu = await getPublicMenu(query);
      // getPublicMenu already writes cache; read back for etag, or set if race.
      entry =
        getCachedPublicMenuEntry(query.search, query.categoryId) ??
        setCachedPublicMenu(menu, query.search, query.categoryId);
    }

    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('ETag', entry.etag);

    if (req.headers['if-none-match'] === entry.etag) {
      res.status(304).end();
      return;
    }

    res.status(entry.statusCode).json({
      success: entry.success,
      message: entry.message,
      data: entry.menu,
    });
  } catch (error) {
    next(error);
  }
}
