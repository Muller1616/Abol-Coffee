export type ActivityDatePreset =
  | 'all'
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'custom'

export const ACTIVITY_DATE_PRESETS: Array<{ value: ActivityDatePreset; label: string }> = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
]

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function resolveActivityDateRange(
  preset: ActivityDatePreset,
  customFrom?: string,
  customTo?: string,
): { from?: string; to?: string } {
  const now = new Date()

  if (preset === 'all') return {}

  if (preset === 'today') {
    return {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    }
  }

  if (preset === 'last7') {
    const from = startOfDay(now)
    from.setDate(from.getDate() - 6)
    return { from: from.toISOString(), to: endOfDay(now).toISOString() }
  }

  if (preset === 'last30') {
    const from = startOfDay(now)
    from.setDate(from.getDate() - 29)
    return { from: from.toISOString(), to: endOfDay(now).toISOString() }
  }

  if (preset === 'thisMonth') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    return { from: from.toISOString(), to: endOfDay(now).toISOString() }
  }

  // custom
  const from = customFrom ? startOfDay(new Date(customFrom)).toISOString() : undefined
  const to = customTo ? endOfDay(new Date(customTo)).toISOString() : undefined
  return {
    ...(from && !Number.isNaN(Date.parse(from)) ? { from } : {}),
    ...(to && !Number.isNaN(Date.parse(to)) ? { to } : {}),
  }
}
