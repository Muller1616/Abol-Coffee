import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

/** Cryptographically secure 6-digit numeric OTP. */
export function generateOtpCode(length = 6): string {
  const max = 10 ** length;
  const min = 10 ** (length - 1);
  return String(randomInt(min, max));
}

/** HMAC-SHA256 hash — OTPs are never stored in plaintext. */
export function hashOtp(otp: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(otp.trim()).digest('hex');
}

export function verifyOtpHash(otp: string, otpHash: string): boolean {
  const candidate = hashOtp(otp);
  const a = Buffer.from(candidate, 'utf8');
  const b = Buffer.from(otpHash, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Opaque reset-session token (raw returned once; only hash stored). */
export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken.trim()).digest('hex');
}
