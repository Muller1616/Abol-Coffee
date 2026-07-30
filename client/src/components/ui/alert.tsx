import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AlertTone = 'danger' | 'warning' | 'success' | 'info'

type AlertProps = {
  children: ReactNode
  title?: ReactNode
  className?: string
  icon?: LucideIcon
  tone?: AlertTone
}

const toneStyles: Record<
  AlertTone,
  { container: string; icon: string; title: string; Icon: LucideIcon }
> = {
  danger: {
    container: 'border-danger/30 bg-danger/10 text-danger',
    icon: 'text-danger',
    title: 'text-danger',
    Icon: AlertCircle,
  },
  warning: {
    container: 'border-accent/40 bg-accent/10 text-foreground',
    icon: 'text-accent',
    title: 'text-foreground',
    Icon: AlertTriangle,
  },
  success: {
    container: 'border-success/30 bg-success/10 text-foreground',
    icon: 'text-success',
    title: 'text-foreground',
    Icon: CheckCircle2,
  },
  info: {
    container: 'border-primary/30 bg-primary/10 text-foreground',
    icon: 'text-primary',
    title: 'text-foreground',
    Icon: Info,
  },
}

export function Alert({
  children,
  title,
  className,
  icon,
  tone = 'danger',
}: AlertProps) {
  const styles = toneStyles[tone]
  const Icon = icon ?? styles.Icon

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xs',
        styles.container,
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', styles.icon)} aria-hidden />
      <div className="space-y-0.5 leading-relaxed">
        {title ? <p className={cn('font-bold', styles.title)}>{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}

export function SuccessAlert(props: Omit<AlertProps, 'tone'>) {
  return <Alert {...props} tone="success" />
}

export function WarningAlert(props: Omit<AlertProps, 'tone'>) {
  return <Alert {...props} tone="warning" />
}

export function ErrorAlert(props: Omit<AlertProps, 'tone'>) {
  return <Alert {...props} tone="danger" />
}

export function InfoAlert(props: Omit<AlertProps, 'tone'>) {
  return <Alert {...props} tone="info" />
}
