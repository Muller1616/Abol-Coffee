import { cn } from '@/lib/utils'

type PasswordStrengthProps = {
  password: string
}

function scorePassword(password: string) {
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  return Math.min(score, 4)
}

const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Excellent'] as const

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = scorePassword(password)
  const label = password ? labels[score] : 'Enter a password'

  return (
    <div className="space-y-2 px-1" aria-live="polite">
      <div className="flex gap-1.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              index < score
                ? score <= 1
                  ? 'bg-danger'
                  : score === 2
                    ? 'bg-accent'
                    : 'bg-success'
                : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength: <span className="font-medium text-foreground">{label}</span>
      </p>
    </div>
  )
}
