import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  fetchCurrentOwner,
  loginRequest,
  logoutRequest,
  type LoginPayload,
  type Owner,
} from '@/features/auth/api'
import { getApiErrorMessage } from '@/lib/api'

type AuthContextValue = {
  owner: Owner | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<Owner>
  logout: () => Promise<void>
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

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchOwnerOrNull,
    retry: false,
    staleTime: 60_000,
  })

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (owner) => {
      queryClient.setQueryData(['auth', 'me'], owner)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
      queryClient.removeQueries({ queryKey: ['auth'] })
      queryClient.removeQueries({ queryKey: ['admin'] })
    },
  })

  const value = useMemo<AuthContextValue>(() => {
    const owner = meQuery.data ?? null

    return {
      owner,
      isAuthenticated: Boolean(owner),
      isLoading: meQuery.isLoading,
      login: async (payload) => loginMutation.mutateAsync(payload),
      logout: async () => {
        await logoutMutation.mutateAsync()
      },
      loginError: loginMutation.error
        ? getApiErrorMessage(loginMutation.error, 'Unable to sign in. Please check your credentials.')
        : null,
      isLoggingIn: loginMutation.isPending,
      clearLoginError: () => loginMutation.reset(),
    }
  }, [loginMutation, logoutMutation, meQuery.data, meQuery.isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
