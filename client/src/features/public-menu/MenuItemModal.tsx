import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Coffee, Sparkles, Share2, Check } from 'lucide-react'
import { useState } from 'react'
import type { PublicMenuItem } from '@/features/public-menu/api'
import { SafeImage } from '@/components/ui/safe-image'
import { resolveMediaUrl } from '@/lib/format'
import { useToast } from '@/components/ui/toast'

type MenuItemModalProps = {
  item: PublicMenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MenuItemModal({ item, open, onOpenChange }: MenuItemModalProps) {
  const imageUrl = resolveMediaUrl(item?.image)
  const [copied, setCopied] = useState(false)
  const { pushToast } = useToast()

  const handleShareDish = async () => {
    if (!item) return
    const text = `${item.name} (${item.priceFormatted} ${item.currency}) at Abol Coffee`
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.name,
          text,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(`${text} - ${window.location.href}`)
        setCopied(true)
        pushToast('Dish details copied to clipboard!', 'success')
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      // User cancelled
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md transition-opacity" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[min(92dvh,720px)] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-white/20 bg-slate-900 text-white shadow-2xl outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/25 sm:hidden" aria-hidden />
          {item ? (
            <div key={item.id}>
              <div className="relative aspect-16/10 overflow-hidden bg-linear-to-br from-[#06120f] via-[#0d2823] to-[#06120f]">
                <SafeImage
                  src={imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30">
                        <Coffee className="h-7 w-7" />
                      </div>
                      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-white">
                        {item.name}
                      </p>
                    </div>
                  }
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent opacity-80" />
              </div>

              <div className="space-y-4 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-7">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/20 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                      <Sparkles className="h-3 w-3" />
                      {item.categoryName}
                    </span>

                    <button
                      type="button"
                      onClick={handleShareDish}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5 text-amber-300" />
                          <span>Share</span>
                        </>
                      )}
                    </button>
                  </div>

                  <DialogPrimitive.Title className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white">
                    {item.name}
                  </DialogPrimitive.Title>

                  <DialogPrimitive.Description className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    {item.description?.trim()
                      ? item.description
                      : 'Prepared fresh with premium authentic ingredients.'}
                  </DialogPrimitive.Description>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Price
                  </span>
                  <span className="rounded-xl bg-linear-to-r from-primary to-emerald-600 px-4 py-1.5 text-base font-extrabold text-white shadow-md">
                    {item.priceFormatted} {item.currency}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <DialogPrimitive.Close className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-md transition hover:bg-black/90 cursor-pointer">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
