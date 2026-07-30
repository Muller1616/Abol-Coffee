import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { FieldError } from '@/components/ui/field-error'
import { cn } from '@/lib/utils'

type FloatingTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> & {
  label: string
  error?: string
  hint?: string
  maxLength?: number
  showCount?: boolean
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  function FloatingTextarea(
    { className, label, error, hint, id, maxLength, showCount = false, value, defaultValue, ...props },
    ref,
  ) {
    const generatedId = useId()
    const textareaId = id ?? generatedId
    const errorId = `${textareaId}-error`
    const hintId = `${textareaId}-hint`
    const currentLength = String(value ?? defaultValue ?? '').length

    return (
      <div className="space-y-2" data-invalid={error ? 'true' : undefined}>
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            placeholder=" "
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'peer min-h-28 w-full cursor-text resize-y rounded-2xl border bg-white/70 px-4 pt-6 pb-3 text-sm text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.65)] outline-none transition-all duration-200 backdrop-blur disabled:cursor-not-allowed disabled:opacity-60',
              'border-border/80 hover:border-primary/40',
              'focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10',
              error && 'border-danger/60 focus:border-danger focus:ring-danger/10',
              className,
            )}
            {...props}
          />
          <label
            htmlFor={textareaId}
            className={cn(
              'pointer-events-none absolute top-4 left-4 origin-left text-sm text-muted-foreground transition-all duration-200',
              'peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:font-medium peer-focus:tracking-wide peer-focus:text-primary',
              'peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium peer-[:not(:placeholder-shown)]:tracking-wide',
              error && 'text-danger peer-focus:text-danger',
            )}
          >
            {label}
          </label>
        </div>
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="min-w-0">
            <FieldError id={errorId} message={error} className="px-0" />
            {!error && hint ? (
              <p id={hintId} className="text-xs text-muted-foreground">
                {hint}
              </p>
            ) : null}
          </div>
          {showCount && maxLength ? (
            <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {currentLength}/{maxLength}
            </p>
          ) : null}
        </div>
      </div>
    )
  },
)
