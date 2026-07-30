import { z } from 'zod';

const requiredEmail = z
  .string({ message: 'Email is required.' })
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.')
  .transform((value) => value.toLowerCase());

const strongPassword = z
  .string({ message: 'New password is required.' })
  .min(1, 'New password is required.')
  .min(8, 'New password must contain at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/\d/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character.');

export const loginSchema = z.object({
  email: requiredEmail,
  password: z
    .string({ message: 'Password is required.' })
    .superRefine((value, ctx) => {
      if (value.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Password is required.' });
        return;
      }
      if (value.trim().length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Password cannot be empty.' });
      }
    }),
  rememberMe: z.boolean().optional().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: 'Current password is required.' })
      .min(1, 'Current password is required.')
      .max(128, 'Password must be at most 128 characters.'),
    newPassword: strongPassword,
    confirmPassword: z
      .string({ message: 'Please confirm your password.' })
      .min(1, 'Please confirm your password.')
      .max(128, 'Password must be at most 128 characters.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: requiredEmail,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** @deprecated Prefer forgotPasswordSchema — kept as route alias. */
export const sendOtpSchema = forgotPasswordSchema;
export type SendOtpInput = ForgotPasswordInput;

export const verifyOtpSchema = z.object({
  email: requiredEmail,
  otpCode: z
    .string({ message: 'OTP code is required.' })
    .trim()
    .min(1, 'OTP code is required.')
    .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits.'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z
  .object({
    resetToken: z
      .string({ message: 'Reset token is required.' })
      .min(1, 'Reset token is required.'),
    newPassword: strongPassword,
    confirmPassword: z
      .string({ message: 'Please confirm your password.' })
      .min(1, 'Please confirm your password.')
      .max(128, 'Password must be at most 128 characters.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Legacy combined reset (no longer used by routes). */
export const resetWithOtpSchema = z
  .object({
    email: requiredEmail,
    otpCode: z
      .string({ message: 'OTP code is required.' })
      .min(1, 'OTP code is required.')
      .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits.'),
    newPassword: strongPassword,
    confirmPassword: z
      .string({ message: 'Please confirm your password.' })
      .min(1, 'Please confirm your password.')
      .max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type ResetWithOtpInput = z.infer<typeof resetWithOtpSchema>;
