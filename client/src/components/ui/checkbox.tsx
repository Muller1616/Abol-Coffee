import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, id, ...props },
  ref,
) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  return (
    <label htmlFor={checkboxId} className="group inline-flex cursor-pointer items-center gap-3">
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            'peer h-5 w-5 appearance-none rounded-md border border-border bg-white/80 transition-all duration-200',
            'checked:border-primary checked:bg-primary',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
            className,
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
      </span>
      <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
        {label}
      </span>
    </label>
  )
})
