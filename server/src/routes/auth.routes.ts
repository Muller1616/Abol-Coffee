import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  getCsrfToken,
  login,
  logout,
  me,
  resetPassword,
  verifyOtp,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import {
  changePasswordRateLimiter,
  forgotPasswordRateLimiter,
  loginRateLimiter,
  verifyOtpRateLimiter,
} from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from '../validators/auth.validators.js';

const authRouter = Router();

authRouter.get('/csrf', getCsrfToken);

authRouter.post('/login', loginRateLimiter, verifyCsrf, validate(loginSchema), login);

authRouter.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  verifyCsrf,
  validate(forgotPasswordSchema),
  forgotPassword,
);

/** Backward-compatible alias. */
authRouter.post(
  '/send-otp',
  forgotPasswordRateLimiter,
  verifyCsrf,
  validate(forgotPasswordSchema),
  forgotPassword,
);

authRouter.post(
  '/verify-otp',
  verifyOtpRateLimiter,
  verifyCsrf,
  validate(verifyOtpSchema),
  verifyOtp,
);

authRouter.post(
  '/reset-password',
  forgotPasswordRateLimiter,
  verifyCsrf,
  validate(resetPasswordSchema),
  resetPassword,
);

authRouter.post('/logout', verifyCsrf, logout);

authRouter.get('/me', authenticate, me);

authRouter.post(
  '/change-password',
  authenticate,
  changePasswordRateLimiter,
  verifyCsrf,
  validate(changePasswordSchema),
  changePassword,
);

export { authRouter };
