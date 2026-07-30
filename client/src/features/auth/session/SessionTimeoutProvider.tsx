import { useCallback, useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'
import { recordSessionActivity } from '@/features/auth/session/activity-bus'
import { SessionWarningModal } from '@/features/auth/session/SessionWarningModal'
import { subscribeSessionSync } from '@/features/auth/session/session-sync'
import { useInactivityTimer } from '@/features/auth/session/use-inactivity-timer'

type SessionTimeoutProviderProps = {
  children: ReactNode
}

/**
 * Enterprise idle-session guard for authenticated owner routes.
 * Mount only inside RequireAuth so public pages are unaffected.
 */
export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleIdleTimeout = useCallback(async () => {
    await logout({ reason: 'inactivity' })
    navigate('/admin/login', { replace: true })
  }, [logout, navigate])

  const { isWarningOpen, secondsRemaining, stayLoggedIn } = useInactivityTimer({
    enabled: isAuthenticated,
    onIdleTimeout: () => {
      void handleIdleTimeout()
    },
  })

  // Page navigations within the admin shell count as activity.
  useEffect(() => {
    if (!isAuthenticated) return
    recordSessionActivity('local')
  }, [isAuthenticated, location.pathname])

  // Cross-tab logout / remote expiry
  useEffect(() => {
    if (!isAuthenticated) return

    return subscribeSessionSync((message) => {
      if (message.type !== 'LOGOUT') return
      void logout({ reason: 'remote', skipServer: true, skipBroadcast: true }).then(() => {
        navigate('/admin/login', { replace: true })
      })
    })
  }, [isAuthenticated, logout, navigate])

  const handleLogoutNow = async () => {
    await logout({ reason: 'manual' })
    navigate('/admin/login', { replace: true })
  }

  return (
    <>
      {children}
      <SessionWarningModal
        open={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={stayLoggedIn}
        onLogoutNow={() => {
          void handleLogoutNow()
        }}
      />
    </>
  )
}
