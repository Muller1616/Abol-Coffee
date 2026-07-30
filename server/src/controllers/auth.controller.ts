import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../config/auth.js';
import {
  changeOwnerPassword,
  getOwnerById,
  loginOwner,
} from '../services/auth.service.js';
import { getRestaurantByOwnerId } from '../services/restaurantIdentity.service.js';
import { buildPublicMenuUrl } from '../services/restaurantIdentity.service.js';
import {
  requestPasswordResetOtp,
  resetPasswordWithSession,
  verifyPasswordResetOtp,
} from '../services/password-reset.service.js';
import { logAdminActivity } from '../services/activity.service.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import {
  clearAccessTokenCookie,
  clearCsrfCookie,
  setAccessTokenCookie,
  setCsrfCookie,
} from '../utils/cookies.js';
import { generateCsrfToken } from '../utils/csrf.js';
import { signAccessToken, verifyAccessToken } from '../utils/jwt.js';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from '../validators/auth.validators.js';

function sessionMaxAge(rememberMe: boolean): number {
  return rememberMe ? authConfig.sessionTtlMs.rememberMe : authConfig.sessionTtlMs.default;
}

function issueCsrf(res: Response, maxAge: number): string {
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken, maxAge);
  return csrfToken;
}

export async function getCsrfToken(_req: Request, res: Response): Promise<void> {
  const csrfToken = issueCsrf(res, authConfig.sessionTtlMs.rememberMe);

  res.status(200).json({
    success: true,
    message: 'CSRF token issued',
    data: { csrfToken },
  });
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as LoginInput;
    const owner = await loginOwner(body);
    const restaurant = await getRestaurantByOwnerId(owner.id);
    const maxAge = sessionMaxAge(Boolean(body.rememberMe));
    const accessToken = signAccessToken(
      { sub: owner.id, email: owner.email, tv: owner.tokenVersion },
      maxAge,
    );

    setAccessTokenCookie(res, accessToken, maxAge);
    const csrfToken = issueCsrf(res, maxAge);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        owner: {
          id: owner.id,
          email: owner.email,
          restaurantSlug: restaurant.slug,
          publicMenuToken: restaurant.publicMenuToken,
          publicMenuUrl: buildPublicMenuUrl(restaurant.publicMenuToken),
        },
        csrfToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[authConfig.accessTokenCookieName];
  if (typeof token === 'string' && token.length > 0) {
    try {
      const payload = verifyAccessToken(token);
      await logAdminActivity({
        action: AdminAction.LOGOUT,
        entity: AdminEntity.OWNER,
        entityId: payload.sub,
        summary: `Owner signed out (${payload.email})`,
      });
    } catch {
      // Token may already be expired — still clear cookies.
    }
  }

  clearAccessTokenCookie(res);
  clearCsrfCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.owner) {
      throw new AppError('Authentication required', 401);
    }

    const owner = await getOwnerById(req.owner.sub);
    const restaurant = await getRestaurantByOwnerId(owner.id);

    res.status(200).json({
      success: true,
      message: 'Authenticated owner',
      data: {
        owner: {
          id: owner.id,
          email: owner.email,
          restaurantSlug: restaurant.slug,
          publicMenuToken: restaurant.publicMenuToken,
          publicMenuUrl: buildPublicMenuUrl(restaurant.publicMenuToken),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.owner) {
      throw new AppError('Authentication required', 401);
    }

    const body = req.body as ChangePasswordInput;
    const owner = await changeOwnerPassword(req.owner.sub, body);

    // Re-issue cookie so the current browser stays signed in after tokenVersion bump.
    const maxAge = authConfig.sessionTtlMs.default;
    const accessToken = signAccessToken(
      { sub: owner.id, email: owner.email, tv: owner.tokenVersion },
      maxAge,
    );
    setAccessTokenCookie(res, accessToken, maxAge);
    const csrfToken = issueCsrf(res, maxAge);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      data: { csrfToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ForgotPasswordInput;
    const result = await requestPasswordResetOtp(body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
        expiresAt: result.expiresAt,
        resendAvailableAt: result.resendAvailableAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/** Alias kept for older clients — same as forgotPassword. */
export const sendOtp = forgotPassword;

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as VerifyOtpInput;
    const result = await verifyPasswordResetOtp(body);

    res.status(200).json({
      success: true,
      message: 'Verification successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ResetPasswordInput;
    await resetPasswordWithSession(body);

    // Invalidate any cookie that might still be present for this browser.
    clearAccessTokenCookie(res);
    clearCsrfCookie(res);
    const csrfToken = issueCsrf(res, authConfig.sessionTtlMs.rememberMe);

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully.',
      data: { csrfToken },
    });
  } catch (error) {
    next(error);
  }
}
