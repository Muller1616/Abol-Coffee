import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { FieldError } from '@/components/ui/field-error'
import { cn } from '@/lib/utils'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { className, label, error, options, placeholder = 'Select an option', id, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className="space-y-2" data-invalid={error ? 'true' : undefined}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-14 w-full cursor-pointer appearance-none rounded-2xl border bg-white/70 px-4 pt-5 pb-2 text-sm text-foreground outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60',
            'border-border/80 hover:border-primary/40 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10',
            error && 'border-danger/60 focus:border-danger focus:ring-danger/10',
            className,
          )}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label
          htmlFor={selectId}
          className={cn(
            'pointer-events-none absolute top-2.5 left-4 text-[11px] font-medium tracking-wide text-muted-foreground',
            error && 'text-danger',
          )}
        >
          {label}
        </label>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
})
