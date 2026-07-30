export type LocationParts = {
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  postalCode?: string | null
}

/** Build a single-line display address from structured parts. */
export function formatRestaurantAddress(parts: LocationParts): string {
  const chunks = [
    parts.address?.trim(),
    parts.city?.trim(),
    parts.state?.trim(),
    parts.postalCode?.trim(),
    parts.country?.trim(),
  ].filter((part): part is string => Boolean(part && part.length > 0))

  return chunks.join(', ')
}

export function hasCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): latitude is number {
  return (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude)
  )
}

/** Haversine distance in kilometers. */
export function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(toLat - fromLat)
  const dLng = toRad(toLng - fromLng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function isAppleMapsPreferred(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
}

export function googleMapsUrl(opts: {
  latitude?: number | null
  longitude?: number | null
  address?: string
}): string {
  if (hasCoordinates(opts.latitude, opts.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${opts.latitude},${opts.longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opts.address ?? '')}`
}

export function appleMapsUrl(opts: {
  latitude?: number | null
  longitude?: number | null
  address?: string
}): string {
  if (hasCoordinates(opts.latitude, opts.longitude)) {
    const q = opts.address ? encodeURIComponent(opts.address) : `${opts.latitude},${opts.longitude}`
    return `https://maps.apple.com/?ll=${opts.latitude},${opts.longitude}&q=${q}`
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(opts.address ?? '')}`
}

/** Addis Ababa — sensible default when no coordinates are set yet. */
export const DEFAULT_MAP_CENTER = { lat: 9.032, lng: 38.7469 } as const
