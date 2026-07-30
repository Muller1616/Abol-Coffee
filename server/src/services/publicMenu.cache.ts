import { MemoryCache } from '../utils/memoryCache.js';
import type { PublicMenuResponse } from './publicMenu.service.js';

/** Short TTL keeps guest menu snappy while admin edits appear within seconds. */
const PUBLIC_MENU_TTL_MS = 15_000;
const CACHE_PREFIX = 'public-menu:';

const cache = new MemoryCache<PublicMenuResponse>(PUBLIC_MENU_TTL_MS);

function cacheKey(search?: string, categoryId?: string): string {
  return `${CACHE_PREFIX}${categoryId ?? ''}|${(search ?? '').trim().toLowerCase()}`;
}

export function getCachedPublicMenu(
  search?: string,
  categoryId?: string,
): PublicMenuResponse | undefined {
  return cache.get(cacheKey(search, categoryId));
}

export function setCachedPublicMenu(
  value: PublicMenuResponse,
  search?: string,
  categoryId?: string,
): void {
  cache.set(cacheKey(search, categoryId), value);
}

/** Call after any category / menu item / restaurant mutation that affects guests. */
export function invalidatePublicMenuCache(): void {
  cache.deleteByPrefix(CACHE_PREFIX);
}
