import type { NextFunction, Request, Response } from 'express';
import { authConfig } from '../config/auth.js';
import {
  changeOwnerPassword,
  getOwnerById,
  loginOwner,
  resetOwnerPasswordWithOtp,
  sendOwnerOtp,
} from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';
import {
  clearAccessTokenCookie,
  clearCsrfCookie,
  setAccessTokenCookie,
  setCsrfCookie,
} from '../utils/cookies.js';
import { generateCsrfToken } from '../utils/csrf.js';
import { signAccessToken } from '../utils/jwt.js';
import type {
  ChangePasswordInput,
  LoginInput,
  ResetWithOtpInput,
  SendOtpInput,
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
    const maxAge = sessionMaxAge(body.rememberMe);
    const accessToken = signAccessToken({ sub: owner.id, email: owner.email }, maxAge);

    setAccessTokenCookie(res, accessToken, maxAge);
    const csrfToken = issueCsrf(res, maxAge);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        owner: {
          id: owner.id,
          email: owner.email,
        },
        csrfToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
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

    res.status(200).json({
      success: true,
      message: 'Authenticated owner',
      data: { owner },
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
    await changeOwnerPassword(req.owner.sub, body);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function sendOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as SendOtpInput;
    const result = await sendOwnerOtp(body);

    res.status(200).json({
      success: true,
      message: 'A 6-digit OTP code has been generated and sent to your email.',
      data: {
        email: result.email,
        otpCode: result.otpCode,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordWithOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as ResetWithOtpInput;
    await resetOwnerPasswordWithOtp(body);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}
