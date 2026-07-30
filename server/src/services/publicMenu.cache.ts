import { createHash } from 'node:crypto';
import { MemoryCache } from '../utils/memoryCache.js';
import type { PublicMenuResponse } from './publicMenu.service.js';

/** Guest menu TTL — client filters locally; slightly longer TTL cuts Neon cold hits. */
const PUBLIC_MENU_TTL_MS = 45_000;
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

function cacheKey(search?: string, categoryId?: string): string {
  return `${CACHE_PREFIX}${categoryId ?? ''}|${(search ?? '').trim().toLowerCase()}`;
}

export function weakEtagFromString(serialized: string): string {
  return `W/"${createHash('sha1').update(serialized).digest('hex')}"`;
}

export function getCachedPublicMenuEntry(
  search?: string,
  categoryId?: string,
): PublicMenuCacheEntry | undefined {
  return cache.get(cacheKey(search, categoryId));
}

/** @deprecated Prefer getCachedPublicMenuEntry — kept for service-layer cache check. */
export function getCachedPublicMenu(
  search?: string,
  categoryId?: string,
): PublicMenuResponse | undefined {
  return cache.get(cacheKey(search, categoryId))?.menu;
}

export function setCachedPublicMenu(
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
  cache.set(cacheKey(search, categoryId), entry);
  return entry;
}

/** Call after any category / menu item / restaurant mutation that affects guests. */
export function invalidatePublicMenuCache(): void {
  cache.deleteByPrefix(CACHE_PREFIX);
}
