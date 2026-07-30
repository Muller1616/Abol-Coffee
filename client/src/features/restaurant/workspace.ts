/** Active owner restaurant slug from the URL workspace (`/{slug}/...`). */
let activeRestaurantSlug: string | null = null

export function setActiveRestaurantSlug(slug: string | null) {
  activeRestaurantSlug = slug ? slug.trim().toLowerCase() : null
}

export function peekActiveRestaurantSlug(): string | null {
  return activeRestaurantSlug
}

export function getActiveRestaurantSlug(): string {
  if (!activeRestaurantSlug) {
    throw new Error('Restaurant workspace is not ready')
  }
  return activeRestaurantSlug
}

/** Build an owner API path scoped to the active restaurant slug. */
export function ownerApiPath(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `/api/r/${getActiveRestaurantSlug()}${suffix}`
}

export function ownerPath(slug: string, segment = ''): string {
  const clean = segment.replace(/^\//, '')
  return clean ? `/${slug}/${clean}` : `/${slug}`
}

export const RESERVED_APP_SEGMENTS = new Set([
  'admin',
  'api',
  'login',
  'menu',
  'assets',
  'static',
])
