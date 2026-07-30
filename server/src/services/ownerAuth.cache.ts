import { MemoryCache } from '../utils/memoryCache.js';

export type OwnerAuthSnapshot = {
  id: string;
  email: string;
  tokenVersion: number;
};

/** Avoid a DB round-trip on every admin request while still honoring tokenVersion revocation quickly. */
export const ownerAuthCache = new MemoryCache<OwnerAuthSnapshot>(10_000);

export function invalidateOwnerAuthCache(ownerId?: string): void {
  if (ownerId) {
    ownerAuthCache.delete(ownerId);
    return;
  }
  ownerAuthCache.clear();
}
