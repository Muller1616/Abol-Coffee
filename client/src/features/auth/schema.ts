import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  rememberMe: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.').max(128),
    newPassword: z
      .string()
      .min(8, 'New password must contain at least 8 characters.')
      .max(128, 'Password must be at most 128 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.').max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password.',
    path: ['newPassword'],
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export const sendOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.'),
})

export type SendOtpFormValues = z.infer<typeof sendOtpSchema>

export const resetWithOtpSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required.')
      .email('Please enter a valid email address.'),
    otpCode: z
      .string()
      .min(1, 'OTP code is required.')
      .regex(/^\d{6}$/, 'OTP code must be 6 digits.'),
    newPassword: z
      .string()
      .min(8, 'New password must contain at least 8 characters.')
      .max(128, 'Password must be at most 128 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.').max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type ResetWithOtpFormValues = z.infer<typeof resetWithOtpSchema>
