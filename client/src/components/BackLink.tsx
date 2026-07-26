import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type BackLinkProps = {
  to?: string
  label?: string
  className?: string
  /** Visual treatment for dark or light surfaces */
  tone?: 'dark' | 'light'
}

export function BackLink({
  to = '/',
  label = 'Back to home',
  className,
  tone = 'dark',
}: BackLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95',
        tone === 'dark' &&
          'bg-black/25 text-white ring-1 ring-white/20 hover:bg-black/40 hover:text-amber-300',
        tone === 'light' &&
          'bg-white text-foreground ring-1 ring-border hover:bg-[#f8fafc] hover:border-primary/30 hover:text-primary',
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </Link>
  )
}
