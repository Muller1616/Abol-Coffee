import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || undefined

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrf_token='))
      ?.split('=')
      .slice(1)
      .join('=')

    if (csrfToken && config.method && config.method.toLowerCase() !== 'get') {
      config.headers.set('X-CSRF-Token', csrfToken)
    }
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
