import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/auth-context'

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#071512]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
