import type { QueryClient } from '@tanstack/react-query'
import { setCsrfToken } from '@/lib/csrf'

/** Wipe owner session state from memory and React Query. */
export function clearClientAuthState(queryClient: QueryClient) {
  setCsrfToken(null)
  queryClient.setQueryData(['auth', 'me'], null)
  queryClient.removeQueries({ queryKey: ['auth'] })
  queryClient.removeQueries({ queryKey: ['admin'] })
}
