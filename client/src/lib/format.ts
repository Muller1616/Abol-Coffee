export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)
  const diffMs = date.getTime() - Date.now()
  const absMs = Math.abs(diffMs)
  const minutes = Math.round(diffMs / 60_000)
  const hours = Math.round(diffMs / 3_600_000)
  const days = Math.round(diffMs / 86_400_000)
  const weeks = Math.round(days / 7)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (absMs < 45_000) return 'Just now'
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  if (Math.abs(days) < 7) return formatter.format(days, 'day')
  if (Math.abs(weeks) < 5) return formatter.format(weeks, 'week')
  return formatter.format(days, 'day')
}

/** Calendar day label for grouping activity history. */
export function formatActivityDayLabel(value: string) {
  const date = new Date(value)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / 86_400_000,
  )

  if (dayDiff === 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date)
}

/** Insert Cloudinary delivery transforms for responsive delivery (idempotent). */
function withCloudinaryOptimization(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  if (/\/upload\/(?:[^/]+,)+/.test(url) || url.includes('/upload/f_auto')) return url
  return url.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_1600/')
}

/**
 * Resolve stored media paths for the browser.
 * Absolute Cloudinary URLs are preferred. Legacy `/uploads/...` paths must hit the API
 * origin when the SPA is hosted separately (set VITE_API_URL).
 */
export function resolveMediaUrl(path: string | null | undefined) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path.startsWith('http') ? withCloudinaryOptimization(path) : path
  }

  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '') || ''
  if (path.startsWith('/') && apiBase) {
    return `${apiBase}${path}`
  }

  return path
}
