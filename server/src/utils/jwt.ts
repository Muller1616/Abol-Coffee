import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

export type JwtPayload = {
  sub: string;
  email: string;
  /** Owner.tokenVersion at issue time — rejects revoked sessions. */
  tv: number;
};

export function signAccessToken(payload: JwtPayload, expiresInMs: number): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: Math.floor(expiresInMs / 1000),
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded !== 'object' || decoded === null) {
      throw new AppError('Invalid authentication token', 401);
    }

    const sub = 'sub' in decoded ? decoded.sub : undefined;
    const email = 'email' in decoded ? decoded.email : undefined;
    const tv = 'tv' in decoded ? decoded.tv : undefined;

    if (typeof sub !== 'string' || typeof email !== 'string') {
      throw new AppError('Invalid authentication token', 401);
    }

    // Legacy tokens without tv are treated as version 0.
    const tokenVersion = typeof tv === 'number' && Number.isFinite(tv) ? tv : 0;

    return { sub, email, tv: tokenVersion };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Invalid or expired authentication token', 401);
  }
}
