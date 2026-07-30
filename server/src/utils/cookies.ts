import type { CookieOptions, Response } from 'express';
import { authConfig } from '../config/auth.js';
import { env } from '../config/env.js';

function baseCookieOptions(httpOnly: boolean): Omit<CookieOptions, 'maxAge'> {
  const sameSite = env.COOKIE_SAME_SITE;
  const secure = env.NODE_ENV === 'production' || sameSite === 'none';

  return {
    httpOnly,
    secure,
    sameSite,
    path: '/',
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  };
}

export function setAccessTokenCookie(res: Response, token: string, maxAge: number): void {
  res.cookie(authConfig.accessTokenCookieName, token, {
    ...baseCookieOptions(true),
    maxAge,
  });
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(authConfig.accessTokenCookieName, baseCookieOptions(true));
}

export function setCsrfCookie(res: Response, token: string, maxAge: number): void {
  res.cookie(authConfig.csrfCookieName, token, {
    ...baseCookieOptions(false),
    maxAge,
  });
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(authConfig.csrfCookieName, baseCookieOptions(false));
}
