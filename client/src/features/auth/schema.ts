import { z } from 'zod'

function requiredEmail() {
  return z
    .string({ error: 'Email is required.' })
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
}

function requiredPassword() {
  return z.string({ error: 'Password is required.' }).superRefine((value, ctx) => {
    if (value.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password is required.' })
      return
    }
    if (value.trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Password cannot be empty.' })
    }
  })
}

const strongPassword = z
  .string({ error: 'New password is required.' })
  .min(1, 'New password is required.')
  .min(8, 'New password must contain at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/\d/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character.')

export const loginSchema = z.object({
  email: requiredEmail(),
  password: requiredPassword(),
  rememberMe: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: 'Current password is required.' })
      .min(1, 'Current password is required.')
      .max(128, 'Password must be at most 128 characters.'),
    newPassword: strongPassword,
    confirmPassword: z
      .string({ error: 'Please confirm your password.' })
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
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export const forgotPasswordSchema = z.object({
  email: requiredEmail(),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const verifyOtpSchema = z.object({
  email: requiredEmail(),
  otpCode: z
    .string({ error: 'OTP code is required.' })
    .trim()
    .min(1, 'OTP code is required.')
    .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits.'),
})

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset session is missing. Please verify your code again.'),
    newPassword: strongPassword,
    confirmPassword: z
      .string({ error: 'Please confirm your password.' })
      .min(1, 'Please confirm your password.')
      .max(128, 'Password must be at most 128 characters.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

/** Manual login validation — reliable fallback for empty submit UX. */
export function validateLoginFields(values: {
  email?: string
  password?: string
}): Partial<Record<'email' | 'password', string>> {
  const errors: Partial<Record<'email' | 'password', string>> = {}
  const email = values.email ?? ''
  const password = values.password ?? ''

  if (email.trim().length === 0) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (password.length === 0) {
    errors.password = 'Password is required.'
  } else if (password.trim().length === 0) {
    errors.password = 'Password cannot be empty.'
  }

  return errors
}
