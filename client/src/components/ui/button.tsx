import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_14px_40px_rgb(16_185_129/0.35)] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgb(16_185_129/0.45)] active:translate-y-0',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[0_10px_28px_rgb(0_0_0/0.25)] hover:brightness-125 hover:-translate-y-0.5 active:translate-y-0',
        outline:
          'border border-border bg-card text-foreground hover:border-primary/50 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0',
        ghost: 'text-foreground hover:bg-muted hover:text-foreground active:bg-muted',
        accent:
          'bg-accent text-accent-foreground hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0',
        danger:
          'bg-danger text-white shadow-[0_12px_30px_rgb(239_68_68/0.28)] hover:brightness-105 hover:-translate-y-0.5 active:translate-y-0',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-14 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
  }

export function Button({
  className,
  variant,
  size,
  type = 'button',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      <span className={cn(loading && 'opacity-90')}>{children}</span>
    </button>
  )
}
