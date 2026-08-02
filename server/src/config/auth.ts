export const authConfig = {
  accessTokenCookieName: 'access_token',
  csrfCookieName: 'csrf_token',
  csrfHeaderName: 'x-csrf-token',
  sessionTtlMs: {
    default: 24 * 60 * 60 * 1000,
    rememberMe: 30 * 24 * 60 * 60 * 1000,
  },
  bcryptSaltRounds: 12,
  /**
   * Precomputed bcrypt hash used only to normalize login timing when the email
   * does not exist (prevents account enumeration via response latency).
   * Password material: `__abol_timing_dummy__` — never a real owner password.
   */
  dummyPasswordHash:
    '$2b$12$0EISNKpuVodebQX9gNxJHue67zMkc8oIYFkkh06wef2h5yonPTOD.',
  loginRateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 20,
  },
  /** Password-reset OTP policy (enterprise defaults). */
  otp: {
    length: 6,
    /** OTP validity window. */
    ttlMs: 3 * 60 * 1000,
    /** Failed verification attempts before the OTP is invalidated. */
    maxAttempts: 5,
    /** Minimum wait before another OTP can be sent for the same email. */
    resendCooldownMs: 60 * 1000,
    /** Forgot-password / resend rate limit (per IP). */
    rateLimit: {
      windowMs: 60 * 60 * 1000,
      max: 5,
    },
    verifyRateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 20,
    },
  },
  /** After OTP verification — time allowed to set a new password. */
  passwordResetSessionTtlMs: 10 * 60 * 1000,
} as const;
