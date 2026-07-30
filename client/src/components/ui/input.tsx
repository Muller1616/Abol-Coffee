import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { FieldError } from '@/components/ui/field-error'
import { cn } from '@/lib/utils'

type FloatingInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder'> & {
  label: string
  error?: string
  hint?: string
  trailing?: ReactNode
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  function FloatingInput({ className, label, error, hint, trailing, id, ...props }, ref) {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const errorId = `${inputId}-error`
    const hintId = `${inputId}-hint`

    return (
      <div className="space-y-2" data-invalid={error ? 'true' : undefined}>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'peer h-14 w-full cursor-text rounded-2xl border bg-white/70 px-4 pt-5 pb-2 text-sm text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] outline-none transition-all duration-200 backdrop-blur disabled:cursor-not-allowed disabled:opacity-60',
              'border-border/80 hover:border-primary/40',
              'focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10',
              error && 'border-danger/60 focus:border-danger focus:ring-danger/10',
              trailing && 'pr-12',
              className,
            )}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'pointer-events-none absolute top-1/2 left-4 origin-left -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200',
              'peer-focus:top-3 peer-focus:-translate-y-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:tracking-wide peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:tracking-wide',
              error && 'text-danger peer-focus:text-danger',
            )}
          >
            {label}
          </label>
          {trailing ? (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">{trailing}</div>
          ) : null}
        </div>
        <FieldError id={errorId} message={error} />
        {!error && hint ? (
          <p id={hintId} className="px-1 text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    )
  },
)
