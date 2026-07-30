import { createHash } from 'node:crypto';
import { MemoryCache } from '../utils/memoryCache.js';
import type { PublicMenuResponse } from './publicMenu.service.js';

/**
 * Short in-process safety TTL. Mutations call invalidatePublicMenuCache() immediately;
 * this only covers multi-instance drift / missed invalidation.
 */
const PUBLIC_MENU_TTL_MS = 10_000;
const CACHE_PREFIX = 'public-menu:';

export type PublicMenuCacheEntry = {
  menu: PublicMenuResponse;
  /** Precomputed weak ETag for the HTTP JSON envelope (avoids re-stringify+hash). */
  etag: string;
  statusCode: number;
  success: boolean;
  message: string;
};

const cache = new MemoryCache<PublicMenuCacheEntry>(PUBLIC_MENU_TTL_MS);

function cacheKey(token: string, search?: string, categoryId?: string): string {
  return `${CACHE_PREFIX}${token}|${categoryId ?? ''}|${(search ?? '').trim().toLowerCase()}`;
}

export function weakEtagFromString(serialized: string): string {
  return `W/"${createHash('sha1').update(serialized).digest('hex')}"`;
}

export function getCachedPublicMenuEntry(
  token: string,
  search?: string,
  categoryId?: string,
): PublicMenuCacheEntry | undefined {
  return cache.get(cacheKey(token, search, categoryId));
}

export function getCachedPublicMenu(
  token: string,
  search?: string,
  categoryId?: string,
): PublicMenuResponse | undefined {
  return cache.get(cacheKey(token, search, categoryId))?.menu;
}

export function setCachedPublicMenu(
  token: string,
  value: PublicMenuResponse,
  search?: string,
  categoryId?: string,
): PublicMenuCacheEntry {
  const success = value.status !== 'MAINTENANCE';
  const message =
    value.status === 'MAINTENANCE' ? value.message : 'Public menu retrieved';
  const statusCode = value.status === 'MAINTENANCE' ? 503 : 200;
  const envelope = { success, message, data: value };
  const serialized = JSON.stringify(envelope);
  const entry: PublicMenuCacheEntry = {
    menu: value,
    etag: weakEtagFromString(serialized),
    statusCode,
    success,
    message,
  };
  cache.set(cacheKey(token, search, categoryId), entry);
  return entry;
}

/** Call after any category / menu item / restaurant mutation that affects guests. */
export function invalidatePublicMenuCache(): void {
  cache.deleteByPrefix(CACHE_PREFIX);
}
