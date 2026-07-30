import { SESSION_MESSAGE_KEY, type SessionLogoutReason } from '@/features/auth/session/constants'
import { SESSION_LOGOUT_MESSAGES } from '@/features/auth/session/constants'

export function stashSessionMessage(reason: SessionLogoutReason) {
  const message = SESSION_LOGOUT_MESSAGES[reason]
  if (!message || typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(SESSION_MESSAGE_KEY, message)
  } catch {
    // Ignore storage failures.
  }
}

export function consumeSessionMessage() {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const message = sessionStorage.getItem(SESSION_MESSAGE_KEY)
    if (message) sessionStorage.removeItem(SESSION_MESSAGE_KEY)
    return message
  } catch {
    return null
  }
}
