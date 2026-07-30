import { useSyncExternalStore } from 'react'

function readCookie(name: string): boolean {
  if (typeof document === 'undefined') return false
  const prefix = `${name}=`
  return document.cookie.split(';').some((part) => part.trim().startsWith(prefix))
}

/** Owner/login routes always need session; public routes only if a CSRF cookie hints a session. */
export function shouldFetchAuthSession(): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  if (path === '/' || path.startsWith('/menu')) {
    return readCookie('csrf_token')
  }
  return true
}

type Listener = () => void
const listeners = new Set<Listener>()
let patched = false

function notify() {
  for (const listener of listeners) listener()
}

function ensureHistoryPatch() {
  if (patched || typeof window === 'undefined') return
  patched = true

  window.addEventListener('popstate', notify)

  const { pushState, replaceState } = window.history
  window.history.pushState = function patchedPushState(...args) {
    const result = pushState.apply(this, args as never)
    notify()
    return result
  }
  window.history.replaceState = function patchedReplaceState(...args) {
    const result = replaceState.apply(this, args as never)
    notify()
    return result
  }
}

function subscribe(listener: Listener) {
  ensureHistoryPatch()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Tracks whether the current route/session should call GET /auth/me. */
export function useAuthSessionEnabled(): boolean {
  return useSyncExternalStore(subscribe, shouldFetchAuthSession, () => false)
}
