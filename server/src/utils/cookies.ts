import type { CookieOptions, Response } from 'express';
import { authConfig } from '../config/auth.js';
import { env } from '../config/env.js';

function baseCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

export function setAccessTokenCookie(res: Response, token: string, maxAge: number): void {
  res.cookie(authConfig.accessTokenCookieName, token, baseCookieOptions(maxAge));
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(authConfig.accessTokenCookieName, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function setCsrfCookie(res: Response, token: string, maxAge: number): void {
  res.cookie(authConfig.csrfCookieName, token, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

export function clearCsrfCookie(res: Response): void {
  res.clearCookie(authConfig.csrfCookieName, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
