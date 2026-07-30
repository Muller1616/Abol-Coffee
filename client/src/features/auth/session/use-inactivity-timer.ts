import { useCallback, useEffect, useRef, useState } from 'react'
import { recordSessionActivity, subscribeSessionActivity } from '@/features/auth/session/activity-bus'
import {
  SESSION_ACTIVITY_THROTTLE_MS,
  SESSION_IDLE_MS,
  SESSION_WARNING_MS,
} from '@/features/auth/session/constants'
import { publishSessionSync, subscribeSessionSync } from '@/features/auth/session/session-sync'

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'mouseup',
  'click',
  'keydown',
  'keyup',
  'scroll',
  'touchstart',
  'touchmove',
  'touchend',
  'pointerdown',
  'pointermove',
  'wheel',
  'dragstart',
  'drop',
]

type UseInactivityTimerOptions = {
  enabled: boolean
  idleMs?: number
  warningMs?: number
  onIdleTimeout: () => void
}

type UseInactivityTimerResult = {
  isWarningOpen: boolean
  secondsRemaining: number
  stayLoggedIn: () => void
  dismissWarningOnly: () => void
}

export function useInactivityTimer({
  enabled,
  idleMs = SESSION_IDLE_MS,
  warningMs = SESSION_WARNING_MS,
  onIdleTimeout,
}: UseInactivityTimerOptions): UseInactivityTimerResult {
  const warnAtMs = idleMs - warningMs

  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(warningMs / 1000))

  const lastActivityRef = useRef(Date.now())
  const warningShownRef = useRef(false)
  const timedOutRef = useRef(false)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastThrottleRef = useRef(0)
  const onIdleTimeoutRef = useRef(onIdleTimeout)

  useEffect(() => {
    onIdleTimeoutRef.current = onIdleTimeout
  }, [onIdleTimeout])

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current)
      warnTimerRef.current = null
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }, [])

  const triggerTimeout = useCallback(() => {
    if (timedOutRef.current) return
    timedOutRef.current = true
    clearTimers()
    setIsWarningOpen(false)
    onIdleTimeoutRef.current()
  }, [clearTimers])

  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)

    const tick = () => {
      const remainingMs = Math.max(0, lastActivityRef.current + idleMs - Date.now())
      setSecondsRemaining(Math.max(0, Math.ceil(remainingMs / 1000)))
      if (remainingMs <= 0) triggerTimeout()
    }

    tick()
    countdownTimerRef.current = setInterval(tick, 250)
  }, [idleMs, triggerTimeout])

  const scheduleFromLastActivity = useCallback(() => {
    clearTimers()
    if (!enabled || timedOutRef.current) return

    const elapsed = Date.now() - lastActivityRef.current
    const untilWarn = warnAtMs - elapsed
    const untilLogout = idleMs - elapsed

    if (untilLogout <= 0) {
      triggerTimeout()
      return
    }

    if (untilWarn <= 0) {
      if (!warningShownRef.current) {
        warningShownRef.current = true
        setIsWarningOpen(true)
      }
      startCountdown()
      logoutTimerRef.current = setTimeout(triggerTimeout, untilLogout)
      return
    }

    warningShownRef.current = false
    setIsWarningOpen(false)
    setSecondsRemaining(Math.ceil(warningMs / 1000))

    warnTimerRef.current = setTimeout(() => {
      warningShownRef.current = true
      setIsWarningOpen(true)
      startCountdown()
    }, untilWarn)

    logoutTimerRef.current = setTimeout(triggerTimeout, untilLogout)
  }, [clearTimers, enabled, idleMs, startCountdown, triggerTimeout, warnAtMs, warningMs])

  const markActivity = useCallback(
    (source: 'local' | 'remote' | 'api', options?: { broadcast?: boolean }) => {
      if (!enabled || timedOutRef.current) return

      // While the warning is visible, only Stay Logged In / cross-tab EXTEND may reset.
      // Accidental mouse movement over the modal must not silently extend the session.
      if (warningShownRef.current && source === 'local') return

      const now = Date.now()
      if (source !== 'remote' && now - lastThrottleRef.current < SESSION_ACTIVITY_THROTTLE_MS) {
        return
      }
      lastThrottleRef.current = now
      lastActivityRef.current = now
      warningShownRef.current = false
      setIsWarningOpen(false)
      setSecondsRemaining(Math.ceil(warningMs / 1000))
      scheduleFromLastActivity()

      if (options?.broadcast !== false && (source === 'local' || source === 'api')) {
        publishSessionSync({ type: 'ACTIVITY', at: now })
      }
    },
    [enabled, scheduleFromLastActivity, warningMs],
  )

  const stayLoggedIn = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    lastThrottleRef.current = now
    warningShownRef.current = false
    timedOutRef.current = false
    setIsWarningOpen(false)
    setSecondsRemaining(Math.ceil(warningMs / 1000))
    scheduleFromLastActivity()
    publishSessionSync({ type: 'EXTEND', at: now })
  }, [scheduleFromLastActivity, warningMs])

  const dismissWarningOnly = useCallback(() => {
    setIsWarningOpen(false)
  }, [])

  // Arm / disarm when enabled flips.
  useEffect(() => {
    if (!enabled) {
      clearTimers()
      warningShownRef.current = false
      timedOutRef.current = false
      setIsWarningOpen(false)
      return
    }

    timedOutRef.current = false
    lastActivityRef.current = Date.now()
    scheduleFromLastActivity()

    return () => {
      clearTimers()
    }
  }, [clearTimers, enabled, scheduleFromLastActivity])

  // DOM activity listeners
  useEffect(() => {
    if (!enabled) return

    const onDomActivity = () => {
      markActivity('local')
    }

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onDomActivity, { capture: true, passive: true })
    })

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Background tabs throttle timers — re-evaluate elapsed idle time.
        scheduleFromLastActivity()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onDomActivity, { capture: true })
      })
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, markActivity, scheduleFromLastActivity])

  // API + remote activity bus
  useEffect(() => {
    if (!enabled) return

    const unsubscribeBus = subscribeSessionActivity((source) => {
      markActivity(source, { broadcast: source === 'local' })
    })

    const unsubscribeSync = subscribeSessionSync((message) => {
      if (message.type === 'ACTIVITY' || message.type === 'EXTEND') {
        lastActivityRef.current = message.at
        lastThrottleRef.current = Date.now()
        warningShownRef.current = false
        timedOutRef.current = false
        setIsWarningOpen(false)
        scheduleFromLastActivity()
      }
    })

    return () => {
      unsubscribeBus()
      unsubscribeSync()
    }
  }, [enabled, markActivity, scheduleFromLastActivity])

  // Route changes count as activity (history API)
  useEffect(() => {
    if (!enabled) return

    const onNav = () => recordSessionActivity('local')
    window.addEventListener('popstate', onNav)
    return () => window.removeEventListener('popstate', onNav)
  }, [enabled])

  return {
    isWarningOpen,
    secondsRemaining,
    stayLoggedIn,
    dismissWarningOnly,
  }
}
