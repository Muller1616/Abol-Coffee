import axios from 'axios'
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

  return config
})

export type ApiSuccess<T> = {
  success: true
  message: string
  data: T
}

export type ApiErrorBody = {
  success: false
  message: string
  field?: string
  details?: unknown
}

export type ApiFieldError = {
  path: string
  message: string
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Unable to connect to the server. Please check your internet connection.'
    }

    const status = error.response.status
    if (status === 500) {
      return 'Something went wrong on our side. Please try again later.'
    }
    if (status === 429) {
      return error.response.data?.message || 'Too many login attempts. Please try again later.'
    }

    return error.response.data?.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

export function getApiErrorField(
  error: unknown,
): { field: string; message: string } | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null
  const data = error.response?.data
  if (data?.field && data?.message) {
    return { field: data.field, message: data.message }
  }
  return null
}

export function getApiValidationDetails(error: unknown): ApiFieldError[] | null {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return null

  const details = error.response?.data?.details
  if (!Array.isArray(details)) return null

  const fieldErrors = details.filter(
    (item): item is ApiFieldError =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as ApiFieldError).path === 'string' &&
      typeof (item as ApiFieldError).message === 'string' &&
      (item as ApiFieldError).path.length > 0,
  )

  return fieldErrors.length > 0 ? fieldErrors : null
}
