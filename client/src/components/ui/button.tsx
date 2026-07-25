import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_12px_30px_rgb(15_118_110/0.28)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgb(15_118_110/0.34)] active:translate-y-0',
        secondary: 'bg-secondary text-secondary-foreground hover:brightness-110',
        outline:
          'border border-border/80 bg-white/70 text-foreground backdrop-blur hover:border-primary/30 hover:bg-white',
        ghost: 'text-foreground hover:bg-muted/70',
        accent: 'bg-accent text-accent-foreground hover:brightness-105',
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
