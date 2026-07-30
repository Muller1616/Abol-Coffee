import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import {
  RESERVED_APP_SEGMENTS,
  peekActiveRestaurantSlug,
  setActiveRestaurantSlug,
} from '@/features/restaurant/workspace'
import { RouteFallback } from '@/components/RouteFallback'

/**
 * Binds the URL :restaurantSlug to the authenticated owner's restaurant.
 * Wrong slug → redirect to the owner's real dashboard (never leak another workspace).
 */
export function RequireRestaurantWorkspace({ children }: { children: React.ReactNode }) {
  const { restaurantSlug } = useParams()
  const { owner, isLoading } = useAuth()
  const slug = (restaurantSlug ?? '').trim().toLowerCase()

  const isOwnerSlug = Boolean(owner?.restaurantSlug && slug === owner.restaurantSlug)

  // Set before children mount/fetch so /api/admin → /api/r/:slug rewrite works on first paint.
  if (isOwnerSlug && peekActiveRestaurantSlug() !== slug) {
    setActiveRestaurantSlug(slug)
  }

  useEffect(() => {
    if (!isOwnerSlug) {
      setActiveRestaurantSlug(null)
      return undefined
    }
    setActiveRestaurantSlug(slug)
    return () => setActiveRestaurantSlug(null)
  }, [isOwnerSlug, slug])

  if (isLoading) {
    return <RouteFallback />
  }

  if (!owner?.restaurantSlug) {
    return <Navigate to="/login" replace />
  }

  if (!slug || RESERVED_APP_SEGMENTS.has(slug)) {
    return <Navigate to={`/${owner.restaurantSlug}/dashboard`} replace />
  }

  if (slug !== owner.restaurantSlug) {
    return <Navigate to={`/${owner.restaurantSlug}/dashboard`} replace />
  }

  return children
}
