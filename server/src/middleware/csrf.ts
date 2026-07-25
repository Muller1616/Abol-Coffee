import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../config/auth.js';
import { AppError } from '../utils/AppError.js';
import { csrfTokensMatch } from '../utils/csrf.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[authConfig.csrfCookieName];
  const headerToken = req.header(authConfig.csrfHeaderName);

  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
    next(new AppError('CSRF token missing', 403));
    return;
  }

  if (!csrfTokensMatch(cookieToken, headerToken)) {
    next(new AppError('Invalid CSRF token', 403));
    return;
  }

  next();
}
