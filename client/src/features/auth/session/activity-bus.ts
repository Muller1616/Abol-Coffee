type ActivityListener = (source: 'local' | 'remote' | 'api') => void

const listeners = new Set<ActivityListener>()

/** Subscribe to session activity pings (DOM, API, or cross-tab). */
export function subscribeSessionActivity(listener: ActivityListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Notify all session timeout subscribers that the user is active. */
export function recordSessionActivity(source: 'local' | 'remote' | 'api' = 'local') {
  listeners.forEach((listener) => listener(source))
}
