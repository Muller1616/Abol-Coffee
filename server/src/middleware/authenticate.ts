import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../config/auth.js';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { ownerAuthCache } from '../services/ownerAuth.cache.js';

export { invalidateOwnerAuthCache } from '../services/ownerAuth.cache.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.cookies?.[authConfig.accessTokenCookieName];

  if (typeof token !== 'string' || token.length === 0) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    let owner = ownerAuthCache.get(payload.sub);

    if (!owner) {
      const row = await prisma.owner.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, tokenVersion: true },
      });
      if (row) {
        owner = row;
        ownerAuthCache.set(row.id, row);
      }
    }

    if (!owner || owner.tokenVersion !== payload.tv) {
      if (owner) ownerAuthCache.delete(owner.id);
      next(new AppError('Your session has expired. Please sign in again.', 401));
      return;
    }

    req.owner = { sub: owner.id, email: owner.email, tv: owner.tokenVersion };
    next();
  } catch (error) {
    next(error);
  }
}
