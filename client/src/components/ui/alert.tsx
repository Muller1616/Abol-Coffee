import { AlertCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AlertProps = {
  children: ReactNode
  title?: ReactNode
  className?: string
  icon?: LucideIcon
}

export function Alert({ children, title, className, icon: Icon = AlertCircle }: AlertProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger shadow-xs',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      <div className="space-y-0.5 leading-relaxed">
        {title ? <p className="font-bold text-danger">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}
