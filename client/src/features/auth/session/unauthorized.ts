type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let handlingUnauthorized = false

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

/** Invoked by the axios 401 interceptor for protected API failures. */
export function notifyUnauthorized() {
  if (handlingUnauthorized) return
  handlingUnauthorized = true
  try {
    unauthorizedHandler?.()
  } finally {
    // Allow a later expiry after the user signs in again.
    window.setTimeout(() => {
      handlingUnauthorized = false
    }, 1500)
  }
}

const EXEMPT_401_PATHS = [
  '/api/auth/login',
  '/api/auth/me',
  '/api/auth/csrf',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/auth/reset-password',
]

export function isExemptUnauthorizedUrl(url: string | undefined) {
  if (!url) return false
  return EXEMPT_401_PATHS.some((path) => url.includes(path))
}
