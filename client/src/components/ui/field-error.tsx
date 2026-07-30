import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type FieldErrorProps = {
  id?: string
  message?: string | null
  className?: string
}

/** Accessible inline field error with consistent styling. */
export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null

  return (
    <p
      id={id}
      role="alert"
      className={cn('flex items-start gap-1.5 px-1 text-xs font-medium text-danger', className)}
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  )
}
