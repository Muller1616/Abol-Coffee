import axios from 'axios'
import { recordSessionActivity } from '@/features/auth/session/activity-bus'
import {
  isExemptUnauthorizedUrl,
  notifyUnauthorized,
} from '@/features/auth/session/unauthorized'
import { getCsrfToken } from '@/lib/csrf'

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || undefined

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase()
  const csrfToken = getCsrfToken()

  if (csrfToken && method && method !== 'get' && method !== 'head') {
    config.headers.set('X-CSRF-Token', csrfToken)
  }

  const url = config.url ?? ''
  const isLogout = url.includes('/api/auth/logout')
  const isMe = url.includes('/api/auth/me')
  const isPublicAuth =
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/csrf') ||
    url.includes('/api/auth/forgot-password') ||
    url.includes('/api/auth/send-otp') ||
    url.includes('/api/auth/verify-otp') ||
    url.includes('/api/auth/reset-password')

  // Owner data mutations / fetches count as activity (not silent /me hydration).
  if (!isLogout && !isMe && !isPublicAuth) {
    recordSessionActivity('api')
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url
      if (!isExemptUnauthorizedUrl(url)) {
        notifyUnauthorized()
      }
    }
    return Promise.reject(error)
  },
)

export type ApiSuccess<T> = {
  success: true
  message: string
  data: T
}

export type ApiErrorBody = {
  success: false
  message: string
  /** Preferred field-keyed validation / business errors. */
  errors?: Record<string, string>
  /** @deprecated Legacy single-field marker — still parsed for compatibility. */
  field?: string
  /** @deprecated Legacy Zod details array — still parsed for compatibility. */
  details?: unknown
}

export type ApiFieldError = {
  path: string
  message: string
}

function readErrorBody(error: unknown): ApiErrorBody | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null
  return error.response?.data ?? null
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again later.',
) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Unable to connect to the server.'
    }

    const status = error.response.status
    if (status === 500 || status === 502 || status === 503) {
      // Preserve intentional maintenance messaging when provided.
      if (status === 503 && error.response.data?.message) {
        return error.response.data.message
      }
      return 'Something went wrong. Please try again later.'
    }
    if (status === 410) {
      return error.response.data?.message || 'This verification code is no longer valid.'
    }
    if (status === 429) {
      return error.response.data?.message || 'Too many attempts. Please try again later.'
    }
    if (status === 401) {
      return error.response.data?.message || 'Your session has expired. Please sign in again.'
    }
    if (status === 403) {
      return error.response.data?.message || 'You are not authorized to access this account.'
    }

    return error.response.data?.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

/** Normalize every known server error shape into path → message entries. */
export function getApiFieldErrors(error: unknown): ApiFieldError[] {
  const data = readErrorBody(error)
  if (!data) return []

  const collected: ApiFieldError[] = []
  const seen = new Set<string>()

  const push = (path: string, message: string) => {
    if (!path || !message || seen.has(path)) return
    seen.add(path)
    collected.push({ path, message })
  }

  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    for (const [path, message] of Object.entries(data.errors)) {
      if (typeof message === 'string') push(path, message)
    }
  }

  if (typeof data.field === 'string' && data.field.length > 0 && typeof data.message === 'string') {
    push(data.field, data.message)
  }

  if (Array.isArray(data.details)) {
    for (const item of data.details) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as ApiFieldError).path === 'string' &&
        typeof (item as ApiFieldError).message === 'string'
      ) {
        push((item as ApiFieldError).path, (item as ApiFieldError).message)
      }
    }
  }

  return collected
}

export function hasApiFieldErrors(error: unknown): boolean {
  return getApiFieldErrors(error).length > 0
}

/** @deprecated Prefer getApiFieldErrors — kept for call-site compatibility. */
export function getApiErrorField(
  error: unknown,
): { field: string; message: string } | null {
  const [first] = getApiFieldErrors(error)
  if (!first) return null
  return { field: first.path, message: first.message }
}

/** @deprecated Prefer getApiFieldErrors — kept for call-site compatibility. */
export function getApiValidationDetails(error: unknown): ApiFieldError[] | null {
  const errors = getApiFieldErrors(error)
  return errors.length > 0 ? errors : null
}
