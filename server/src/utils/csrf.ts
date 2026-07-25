import { randomBytes, timingSafeEqual } from 'node:crypto';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function csrfTokensMatch(cookieToken: string, headerToken: string): boolean {
  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (cookieBuffer.length !== headerBuffer.length) {
    return false;
  }

  return timingSafeEqual(cookieBuffer, headerBuffer);
}
