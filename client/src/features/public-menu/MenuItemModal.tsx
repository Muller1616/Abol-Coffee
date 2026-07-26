import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { X, Coffee, Sparkles, Share2, Check } from 'lucide-react'
import { useState } from 'react'
import type { PublicMenuItem } from '@/features/public-menu/api'
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
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/20 bg-slate-900 text-white shadow-2xl focus:outline-none">
          {item ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Image / Header Block */}
              <div className="relative aspect-16/10 overflow-hidden bg-linear-to-br from-[#06120f] via-[#0d2823] to-[#06120f]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30">
                      <Coffee className="h-7 w-7" />
                    </div>
                    <p className="font-display mt-3 text-2xl font-bold tracking-tight text-white">
                      {item.name}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent opacity-80" />
              </div>

              {/* Details Content */}
              <div className="space-y-4 p-6 sm:p-7">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider border border-amber-400/30">
                      <Sparkles className="h-3 w-3" />
                      {item.categoryName}
                    </span>

                    <button
                      type="button"
                      onClick={handleShareDish}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white cursor-pointer"
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

                  <DialogPrimitive.Title className="font-display mt-3 text-2xl font-extrabold tracking-tight text-white">
                    {item.name}
                  </DialogPrimitive.Title>

                  <DialogPrimitive.Description className="mt-2.5 text-sm leading-relaxed text-slate-300">
                    {item.description?.trim()
                      ? item.description
                      : 'Prepared fresh with premium authentic ingredients.'}
                  </DialogPrimitive.Description>
                </div>

                {/* Price Bar */}
                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Price
                  </span>
                  <span className="rounded-xl bg-linear-to-r from-primary to-emerald-600 px-4 py-1.5 text-base font-extrabold text-white shadow-md">
                    {item.priceFormatted} {item.currency}
                  </span>
                </div>
              </div>
            </motion.div>
          ) : null}

          <DialogPrimitive.Close className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white shadow-md backdrop-blur-md transition hover:bg-black/90 cursor-pointer">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
