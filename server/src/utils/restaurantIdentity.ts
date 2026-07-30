import { randomBytes } from 'node:crypto';

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'assets',
  'login',
  'logout',
  'menu',
  'public',
  'static',
  'health',
  'auth',
  'owner',
  'settings',
  'account',
  'dashboard',
  'categories',
  'restaurant',
  'activity',
  'qr',
]);

/** URL-safe permanent public menu token (never derived from menu content). */
export function generatePublicMenuToken(): string {
  return randomBytes(18).toString('base64url');
}

export function slugifyRestaurantName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 48);

  return base.length >= 2 ? base : 'restaurant';
}

export function isReservedRestaurantSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function assertValidRestaurantSlug(slug: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Restaurant slug must be lowercase letters, numbers, and hyphens only.');
  }
  if (slug.length < 2 || slug.length > 64) {
    throw new Error('Restaurant slug must be between 2 and 64 characters.');
  }
  if (isReservedRestaurantSlug(slug)) {
    throw new Error(`Restaurant slug "${slug}" is reserved.`);
  }
}
