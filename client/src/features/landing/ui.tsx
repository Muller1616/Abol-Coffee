import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Shared landing layout + surface primitives — one visual language for the page. */

export function LandingContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  )
}

export function LandingSection({
  id,
  children,
  className,
  tone = 'ivory',
}: {
  id?: string
  children: ReactNode
  className?: string
  tone?: 'ivory' | 'white' | 'ink'
}) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-20 sm:py-24 lg:py-28',
        tone === 'ivory' && 'bg-background',
        tone === 'white' && 'bg-card',
        tone === 'ink' && 'bg-brand-ink text-white',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function LandingEyebrow({
  children,
  className,
  onDark = false,
}: {
  children: ReactNode
  className?: string
  onDark?: boolean
}) {
  return (
    <p
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase',
        onDark
          ? 'border border-white/15 bg-white/10 text-white/90'
          : 'border border-primary/20 bg-primary/10 text-primary',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function LandingHeading({
  children,
  className,
  as: Tag = 'h2',
}: {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <Tag
      className={cn(
        'font-display font-semibold tracking-tight text-balance',
        Tag === 'h1' && 'text-4xl sm:text-5xl lg:text-6xl',
        Tag === 'h2' && 'text-3xl sm:text-4xl',
        Tag === 'h3' && 'text-xl sm:text-2xl',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function LandingLead({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg', className)}>
      {children}
    </p>
  )
}

export function LandingSectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  onDark = false,
}: {
  eyebrow: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  onDark?: boolean
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' ? 'mx-auto text-center' : 'text-left')}>
      <LandingEyebrow onDark={onDark}>{eyebrow}</LandingEyebrow>
      <LandingHeading
        className={cn('mt-4', onDark ? 'text-white' : 'text-foreground')}
      >
        {title}
      </LandingHeading>
      {description ? (
        <LandingLead className={cn(onDark && 'text-white/70', align === 'center' && 'mx-auto')}>
          {description}
        </LandingLead>
      ) : null}
    </div>
  )
}

export function LandingCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgb(28_25_23/0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_rgb(28_25_23/0.08)] sm:p-7',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function LandingIconTile({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary',
        className,
      )}
    >
      {children}
    </div>
  )
}
