import { Router } from 'express';
import {
  changePassword,
  getCsrfToken,
  login,
  logout,
  me,
  resetPasswordWithOtp,
  sendOtp,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { changePasswordRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  loginSchema,
  resetWithOtpSchema,
  sendOtpSchema,
} from '../validators/auth.validators.js';

const authRouter = Router();

authRouter.get('/csrf', getCsrfToken);

authRouter.post('/login', loginRateLimiter, verifyCsrf, validate(loginSchema), login);

authRouter.post('/send-otp', loginRateLimiter, verifyCsrf, validate(sendOtpSchema), sendOtp);

authRouter.post(
  '/reset-password-otp',
  loginRateLimiter,
  verifyCsrf,
  validate(resetWithOtpSchema),
  resetPasswordWithOtp,
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
