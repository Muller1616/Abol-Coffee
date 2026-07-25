import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
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

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-14 w-full appearance-none rounded-2xl border bg-white/70 px-4 pt-5 pb-2 text-sm text-foreground outline-none transition-all duration-200',
            'border-border/80 hover:border-primary/30 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10',
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
          className="pointer-events-none absolute top-2.5 left-4 text-[11px] font-medium tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {error ? <p className="px-1 text-xs font-medium text-danger">{error}</p> : null}
    </div>
  )
})
