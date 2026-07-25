let memoryCsrfToken: string | null = null

export function setCsrfToken(token: string | null) {
  memoryCsrfToken = token
}

export function getCsrfToken() {
  if (memoryCsrfToken) {
    return memoryCsrfToken
  }

  if (typeof document === 'undefined') {
    return null
  }

  const cookieToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')
    .slice(1)
    .join('=')

  return cookieToken ?? null
}
