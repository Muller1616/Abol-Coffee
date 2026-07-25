export const authConfig = {
  accessTokenCookieName: 'access_token',
  csrfCookieName: 'csrf_token',
  csrfHeaderName: 'x-csrf-token',
  sessionTtlMs: {
    default: 24 * 60 * 60 * 1000,
    rememberMe: 30 * 24 * 60 * 60 * 1000,
  },
  bcryptSaltRounds: 12,
  loginRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 20,
  },
} as const;
