import rateLimit from 'express-rate-limit';
import { authConfig } from '../config/auth.js';

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
