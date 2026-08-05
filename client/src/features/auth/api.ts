import { api, type ApiSuccess } from '@/lib/api'
import { getCsrfToken, setCsrfToken } from '@/lib/csrf'

export type Owner = {
  id: string
  email: string
  restaurantSlug: string
  publicMenuToken: string
  publicMenuUrl: string
}

export type LoginPayload = {
  email: string
  password: string
  rememberMe: boolean
}

export async function fetchCsrfToken() {
  const { data } = await api.get<ApiSuccess<{ csrfToken: string }>>('/api/auth/csrf')
  setCsrfToken(data.data.csrfToken)
  return data.data.csrfToken
}

export async function ensureCsrfToken() {
  const existing = getCsrfToken()
  if (existing) return existing
  return fetchCsrfToken()
}

export async function loginRequest(payload: LoginPayload) {
  const csrf = await fetchCsrfToken()

  const { data } = await api.post<ApiSuccess<{ owner: Owner; csrfToken: string }>>(
    '/api/auth/login',
    payload,
    {
      headers: {
        'X-CSRF-Token': csrf,
      },
    },
  )

  setCsrfToken(data.data.csrfToken)
  return data.data.owner
}

export async function logoutRequest() {
  await fetchCsrfToken()
  await api.post<ApiSuccess<undefined>>('/api/auth/logout')
  setCsrfToken(null)
}

export async function fetchCurrentOwner() {
  const { data } = await api.get<ApiSuccess<{ owner: Owner }>>('/api/auth/me')
  return data.data.owner
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function changePasswordRequest(payload: ChangePasswordPayload) {
  await ensureCsrfToken()
  const { data } = await api.post<ApiSuccess<{ csrfToken?: string } | undefined>>(
    '/api/auth/change-password',
    payload,
  )
  if (data.data?.csrfToken) setCsrfToken(data.data.csrfToken)
  return data
}

export type ForgotPasswordPayload = {
  email: string
}

export type ForgotPasswordResult = {
  email: string
  expiresAt: string | null
  resendAvailableAt: string | null
}

export async function forgotPasswordRequest(payload: ForgotPasswordPayload) {
  await fetchCsrfToken()
  const { data } = await api.post<ApiSuccess<ForgotPasswordResult>>(
    '/api/auth/forgot-password',
    payload,
  )
  return data
}

/** @deprecated Prefer forgotPasswordRequest */
export async function sendOtpRequest(payload: ForgotPasswordPayload) {
  return forgotPasswordRequest(payload)
}

export type VerifyOtpPayload = {
  email: string
  otpCode: string
}

export type VerifyOtpResult = {
  resetToken: string
  expiresAt: string
  email: string
}

export async function verifyOtpRequest(payload: VerifyOtpPayload) {
  await fetchCsrfToken()
  const { data } = await api.post<ApiSuccess<VerifyOtpResult>>('/api/auth/verify-otp', payload)
  return data
}

export type ResetPasswordPayload = {
  resetToken: string
  newPassword: string
  confirmPassword: string
}

export async function resetPasswordRequest(payload: ResetPasswordPayload) {
  await fetchCsrfToken()
  const { data } = await api.post<ApiSuccess<{ csrfToken?: string }>>(
    '/api/auth/reset-password',
    payload,
  )
  if (data.data?.csrfToken) setCsrfToken(data.data.csrfToken)
  return data
}
