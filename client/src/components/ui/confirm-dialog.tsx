import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Optional highlighted warning block under the description. */
  warning?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  tone?: 'danger' | 'warning' | 'default'
  /** When false, hide the confirm action (e.g. blocked destructive ops). */
  showConfirm?: boolean
  onConfirm: () => void
}

const toneStyles = {
  danger: {
    iconWrap: 'bg-danger/10 text-danger ring-danger/20',
    warning: 'border-danger/25 bg-danger/5 text-danger',
    confirmClass:
      'bg-danger text-white shadow-[0_12px_30px_rgb(239_68_68/0.28)] hover:brightness-105 hover:shadow-[0_18px_40px_rgb(239_68_68/0.34)]',
  },
  warning: {
    iconWrap: 'bg-accent/15 text-accent ring-accent/25',
    warning: 'border-accent/30 bg-accent/10 text-foreground',
    confirmClass: undefined,
  },
  default: {
    iconWrap: 'bg-primary/10 text-primary ring-primary/20',
    warning: 'border-border bg-[#f8fafc] text-foreground',
    confirmClass: undefined,
  },
} as const

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  warning,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  tone = 'default',
  showConfirm = true,
  onConfirm,
}: ConfirmDialogProps) {
  const styles = toneStyles[tone]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} hideHeader>
        <div className="space-y-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1',
                styles.iconWrap,
              )}
              aria-hidden
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-2 pr-8">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>

          {warning ? (
            <div
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm leading-relaxed',
                styles.warning,
              )}
              role="status"
            >
              {warning}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            {showConfirm ? (
              <Button
                type="button"
                loading={loading}
                disabled={loading}
                className={cn('h-11 w-full sm:w-auto', styles.confirmClass)}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
