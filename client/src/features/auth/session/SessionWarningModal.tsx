import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SessionWarningModalProps = {
  open: boolean
  secondsRemaining: number
  onStayLoggedIn: () => void
  onLogoutNow: () => void
}

export function SessionWarningModal({
  open,
  secondsRemaining,
  onStayLoggedIn,
  onLogoutNow,
}: SessionWarningModalProps) {
  const label =
    secondsRemaining <= 1 ? '1 second' : `${Math.max(secondsRemaining, 0)} seconds`

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#06120f]/55 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-[70] max-h-[min(92dvh,920px)] w-full overflow-y-auto border border-border/80 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_30px_80px_rgb(15_23_42/0.28)] outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7 sm:pb-7 rounded-t-[28px]"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted sm:hidden" aria-hidden />

          <div className="space-y-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25"
                aria-hidden
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0 space-y-2">
                <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-foreground">
                  Session Expiring Soon
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
                  For your security, your session will expire in{' '}
                  <span className="font-semibold text-foreground">{label}</span> due to inactivity.
                </DialogPrimitive.Description>
              </div>
            </div>

            <div
              className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-950"
              role="status"
              aria-live="polite"
            >
              You will be signed out automatically unless you choose to stay logged in.
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={onLogoutNow}
              >
                Log Out Now
              </Button>
              <Button type="button" className="h-11 w-full sm:w-auto" onClick={onStayLoggedIn}>
                Stay Logged In
              </Button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
