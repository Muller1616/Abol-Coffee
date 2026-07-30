import {
  SESSION_CHANNEL_NAME,
  SESSION_STORAGE_KEY,
  type SessionSyncMessage,
} from '@/features/auth/session/constants'

type SyncHandler = (message: SessionSyncMessage) => void

let channel: BroadcastChannel | null = null
const handlers = new Set<SyncHandler>()
let storageBound = false

function notify(message: SessionSyncMessage) {
  handlers.forEach((handler) => handler(message))
}

function ensureChannel() {
  if (typeof window === 'undefined') return null
  if (typeof BroadcastChannel === 'undefined') return null
  if (!channel) {
    channel = new BroadcastChannel(SESSION_CHANNEL_NAME)
    channel.onmessage = (event: MessageEvent<SessionSyncMessage>) => {
      if (!event.data?.type) return
      notify(event.data)
    }
  }
  return channel
}

function ensureStorageBridge() {
  if (typeof window === 'undefined' || storageBound) return
  storageBound = true
  window.addEventListener('storage', (event) => {
    if (event.key !== SESSION_STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as SessionSyncMessage
      if (parsed?.type) notify(parsed)
    } catch {
      // Ignore malformed sync payloads.
    }
  })
}

export function subscribeSessionSync(handler: SyncHandler) {
  ensureChannel()
  ensureStorageBridge()
  handlers.add(handler)
  return () => {
    handlers.delete(handler)
  }
}

export function publishSessionSync(message: SessionSyncMessage) {
  ensureChannel()?.postMessage(message)

  if (typeof window === 'undefined') return
  try {
    // Storage events only fire in *other* tabs — use as BroadcastChannel fallback.
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(message))
    // Clear so the same payload can be re-published later.
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Private mode / quota — ignore.
  }
}
