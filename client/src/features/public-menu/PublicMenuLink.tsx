import { Link } from 'react-router-dom'
import { usePublicMenuEntry } from '@/features/public-menu/use-public-menu-entry'
import { cn } from '@/lib/utils'

type PublicMenuLinkProps = {
  className?: string
  children: React.ReactNode
}

/** Resolves the permanent `/menu/{token}` path for marketing CTAs. */
export function PublicMenuLink({ className, children }: PublicMenuLinkProps) {
  const entry = usePublicMenuEntry()
  const to = entry.data?.menuPath ?? '/menu'

  return (
    <Link to={to} className={cn(className)}>
      {children}
    </Link>
  )
}
