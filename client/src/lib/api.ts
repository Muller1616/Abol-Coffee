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
  details?: unknown
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
