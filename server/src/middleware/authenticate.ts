import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../config/auth.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[authConfig.accessTokenCookieName];

  if (typeof token !== 'string' || token.length === 0) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    req.owner = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
