import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { getPublicMenu } from '../services/publicMenu.service.js';
import type { PublicMenuQuery } from '../validators/publicMenu.validators.js';

function weakEtag(payload: unknown): string {
  const hash = createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  return `W/"${hash}"`;
}

export async function getPublicMenuHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.validatedQuery as PublicMenuQuery;
    const menu = await getPublicMenu(query ?? {});

    // Short private cache + ETag: browsers/proxies can revalidate quickly;
    // in-memory server cache still serves most hot traffic.
    res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    res.setHeader('Vary', 'Accept-Encoding');

    if (menu.status === 'MAINTENANCE') {
      const body = {
        success: false,
        message: menu.message,
        data: menu,
      };
      const etag = weakEtag(body);
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }
      res.status(503).json(body);
      return;
    }

    const body = {
      success: true,
      message: 'Public menu retrieved',
      data: menu,
    };
    const etag = weakEtag(body);
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
