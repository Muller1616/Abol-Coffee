import { z } from 'zod';

const requiredEmail = z
  .string({ message: 'Email is required.' })
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email address.');

const requiredPassword = z
  .string({ message: 'Password is required.' })
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password is required.' });
      return;
    }
    if (value.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password cannot be empty.' });
    }
  });

export const loginSchema = z.object({
  email: requiredEmail,
  password: requiredPassword,
  rememberMe: z.boolean().optional().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: 'Current password is required.' })
      .min(1, 'Current password is required.')
      .max(128, 'Password must be at most 128 characters.'),
    newPassword: z
      .string({ message: 'New password is required.' })
      .min(1, 'New password is required.')
      .min(8, 'New password must contain at least 8 characters.')
      .max(128, 'Password must be at most 128 characters.'),
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

export const sendOtpSchema = z.object({
  email: requiredEmail,
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const resetWithOtpSchema = z
  .object({
    email: requiredEmail,
    otpCode: z
      .string({ message: 'OTP code is required.' })
      .min(1, 'OTP code is required.')
      .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits.'),
    newPassword: z
      .string({ message: 'New password is required.' })
      .min(8, 'New password must contain at least 8 characters.')
      .max(128, 'Password must be at most 128 characters.'),
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
