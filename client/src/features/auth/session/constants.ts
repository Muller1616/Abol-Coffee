/** Idle session policy for the owner console. */
export const SESSION_IDLE_MS = 5 * 60 * 1000
/** Show warning this long before forced logout. */
export const SESSION_WARNING_MS = 1 * 60 * 1000
/** Activity earlier than this is ignored (debounce). */
export const SESSION_ACTIVITY_THROTTLE_MS = 1000

export const SESSION_CHANNEL_NAME = 'abol-coffee-auth'
export const SESSION_STORAGE_KEY = 'abol-coffee-auth-sync'
export const SESSION_MESSAGE_KEY = 'abol-coffee-session-message'

export type SessionLogoutReason = 'manual' | 'inactivity' | 'expired' | 'remote'

export type SessionSyncMessage =
  | { type: 'LOGOUT'; reason: SessionLogoutReason; at: number }
  | { type: 'ACTIVITY'; at: number }
  | { type: 'EXTEND'; at: number }

export const SESSION_LOGOUT_MESSAGES: Record<SessionLogoutReason, string> = {
  manual: '',
  inactivity: 'Your session has expired due to inactivity. Please sign in again.',
  expired: 'Your session has expired. Please sign in again.',
  remote: 'You were signed out in another tab. Please sign in again.',
}
