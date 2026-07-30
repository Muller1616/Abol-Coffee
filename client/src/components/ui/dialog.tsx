import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  overlayClassName,
  children,
  title,
  description,
  hideHeader = false,
}: {
  className?: string
  overlayClassName?: string
  children: ReactNode
  title: string
  description?: string
  /** When true, title/description are only exposed to assistive tech (custom header in children). */
  hideHeader?: boolean
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn('fixed inset-0 z-50 bg-[#06120f]/45 backdrop-blur-sm', overlayClassName)}
      />
      <DialogPrimitive.Content
        className={cn(
          // Mobile: bottom sheet. Desktop: centered modal.
          'fixed z-50 max-h-[min(92dvh,920px)] w-full overflow-y-auto overscroll-contain border border-border/80 bg-white shadow-[0_30px_80px_rgb(15_23_42/0.2)] outline-none',
          'inset-x-0 bottom-0 rounded-t-[28px] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:p-7 sm:pb-7',
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted sm:hidden" aria-hidden />

        {hideHeader ? (
          <>
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {description ?? title}
            </DialogPrimitive.Description>
          </>
        ) : (
          <div className="mb-5 pr-10 sm:mb-6">
            <DialogPrimitive.Title className="text-xl font-semibold tracking-tight">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
        )}

        {children}

        <DialogPrimitive.Close className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:scale-105 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:top-5 sm:right-5">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
