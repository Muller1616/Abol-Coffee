import { api, type ApiSuccess } from '@/lib/api'
import { getCsrfToken, setCsrfToken } from '@/lib/csrf'

export type Owner = {
  id: string
  email: string
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
  await fetchCsrfToken()

  const { data } = await api.post<ApiSuccess<{ owner: Owner; csrfToken: string }>>(
    '/api/auth/login',
    payload,
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
