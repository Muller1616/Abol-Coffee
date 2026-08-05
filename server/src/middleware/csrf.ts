import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../config/auth.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { csrfTokensMatch } from '../utils/csrf.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function clientOrigin(): string {
  return stripTrailingSlash(env.CLIENT_URL);
}

/**
 * Browser requests from the SPA should send Origin (CORS) or Referer.
 * Same-origin navigations may send Sec-Fetch-Site instead.
 */
function isTrustedBrowserRequest(req: Request): boolean {
  const allowed = clientOrigin();
  const origin = req.get('origin');

  if (origin) {
    return stripTrailingSlash(origin) === allowed;
  }

  const referer = req.get('referer');
  if (referer) {
    try {
      return stripTrailingSlash(new URL(referer).origin) === allowed;
    } catch {
      return false;
    }
  }

  const fetchSite = (req.get('sec-fetch-site') || '').toLowerCase();
  return fetchSite === 'same-origin' || fetchSite === 'same-site';
}

/**
 * CSRF protection for cookie-authenticated SPA.
 *
 * - Always require X-CSRF-Token (blocks simple cross-site form posts).
 * - If csrf cookie is present, enforce classic double-submit match.
 * - If cookie is missing (common when browsers block cross-site cookies between
 *   Vercel ↔ Render), accept a valid header token only from a trusted Origin.
 *   Attackers cannot read the token JSON due to CORS, and cannot send the custom
 *   header from a foreign origin without failing the preflight.
 */
export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[authConfig.csrfCookieName];
  const headerToken = req.header(authConfig.csrfHeaderName);

  if (typeof headerToken !== 'string' || headerToken.length < 16) {
    next(new AppError('CSRF token missing', 403));
    return;
  }

  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    if (!csrfTokensMatch(cookieToken, headerToken)) {
      next(new AppError('Invalid CSRF token', 403));
      return;
    }
    next();
    return;
  }

  if (!isTrustedBrowserRequest(req)) {
    next(new AppError('CSRF token missing', 403));
    return;
  }

  next();
}
