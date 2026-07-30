import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import {
  fetchCurrentOwner,
  loginRequest,
  logoutRequest,
  type LoginPayload,
  type Owner,
} from '@/features/auth/api'
import { clearClientAuthState } from '@/features/auth/session/clear-client-auth'
import type { SessionLogoutReason } from '@/features/auth/session/constants'
import { stashSessionMessage } from '@/features/auth/session/session-message'
import { publishSessionSync } from '@/features/auth/session/session-sync'
import { setUnauthorizedHandler } from '@/features/auth/session/unauthorized'
import { useAuthSessionEnabled } from '@/features/auth/use-auth-session-enabled'
import { getApiErrorMessage } from '@/lib/api'

export type LogoutOptions = {
  reason?: SessionLogoutReason
  /** Skip calling POST /logout when the server session is already gone. */
  skipServer?: boolean
  /** Skip multi-tab broadcast (used when handling a remote logout event). */
  skipBroadcast?: boolean
}

type AuthContextValue = {
  owner: Owner | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<Owner>
  logout: (options?: LogoutOptions) => Promise<void>
  loginError: string | null
  isLoggingIn: boolean
  clearLoginError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchOwnerOrNull() {
  try {
    return await fetchCurrentOwner()
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null
    }
    throw error
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const authEnabled = useAuthSessionEnabled()

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchOwnerOrNull,
    retry: false,
    staleTime: 5 * 60_000,
    enabled: authEnabled,
  })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (owner) => {
      queryClient.setQueryData(['auth', 'me'], owner)
    },
  })

  const clearSession = useCallback(
    (reason: SessionLogoutReason) => {
      clearClientAuthState(queryClient)
      if (reason !== 'manual') {
        stashSessionMessage(reason)
      }
    },
    [queryClient],
  )

  const logoutMutation = useMutation({
    mutationFn: async (options: LogoutOptions = {}) => {
      const reason = options.reason ?? 'manual'
      if (!options.skipServer) {
        try {
          await logoutRequest()
        } catch {
          // Always clear local auth even if the network/server call fails.
        }
      }
      return reason
    },
    onSuccess: (reason, options) => {
      clearSession(reason)
      if (!options?.skipBroadcast) {
        publishSessionSync({ type: 'LOGOUT', reason, at: Date.now() })
      }
    },
    onError: (_error, options) => {
      const reason = options?.reason ?? 'manual'
      clearSession(reason)
      if (!options?.skipBroadcast) {
        publishSessionSync({ type: 'LOGOUT', reason, at: Date.now() })
      }
    },
  })

  const login = useCallback(
    async (payload: LoginPayload) => loginMutation.mutateAsync(payload),
    [loginMutation.mutateAsync],
  )

  const logout = useCallback(
    async (options?: LogoutOptions) => {
      await logoutMutation.mutateAsync(options ?? {})
    },
    [logoutMutation.mutateAsync],
  )

  const clearLoginError = useCallback(() => {
    loginMutation.reset()
  }, [loginMutation.reset])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      const owner = queryClient.getQueryData<Owner | null>(['auth', 'me'])
      if (!owner) return

      clearClientAuthState(queryClient)
      stashSessionMessage('expired')
      publishSessionSync({ type: 'LOGOUT', reason: 'expired', at: Date.now() })
    })

    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(() => {
    const owner = meQuery.data ?? null

    return {
      owner,
      isAuthenticated: Boolean(owner),
      // Avoid blocking public pages while auth is intentionally skipped.
      isLoading: authEnabled ? meQuery.isLoading : false,
      login,
      logout,
      loginError: loginMutation.error
        ? getApiErrorMessage(loginMutation.error, 'Unable to sign in. Please check your credentials.')
        : null,
      isLoggingIn: loginMutation.isPending,
      clearLoginError,
    }
  }, [
    authEnabled,
    clearLoginError,
    login,
    loginMutation.error,
    loginMutation.isPending,
    logout,
    meQuery.data,
    meQuery.isLoading,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
