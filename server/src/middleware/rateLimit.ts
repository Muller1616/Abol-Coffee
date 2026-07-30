import rateLimit from 'express-rate-limit';
import { authConfig } from '../config/auth.js';

/** Soft global API guard — auth routes use stricter dedicated limiters. */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again shortly.',
  },
});

export const publicMenuRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many menu requests. Please try again shortly.',
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: authConfig.loginRateLimit.windowMs,
  max: authConfig.loginRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

export const changePasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password change attempts. Please try again later.',
  },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: authConfig.otp.rateLimit.windowMs,
  max: authConfig.otp.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.',
  },
});

export const verifyOtpRateLimiter = rateLimit({
  windowMs: authConfig.otp.verifyRateLimit.windowMs,
  max: authConfig.otp.verifyRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
  },
});
