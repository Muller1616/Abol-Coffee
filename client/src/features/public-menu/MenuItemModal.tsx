import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { PublicMenuItem } from '@/features/public-menu/api'
import { resolveMediaUrl } from '@/lib/format'

type MenuItemModalProps = {
  item: PublicMenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MenuItemModal({ item, open, onOpenChange }: MenuItemModalProps) {
  const imageUrl = resolveMediaUrl(item?.image)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#06120f]/50 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[28px] border border-border/80 bg-white shadow-[0_30px_80px_rgb(15_23_42/0.22)] focus:outline-none">
          {item ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="relative aspect-[16/10] bg-[linear-gradient(145deg,#0f766e_0%,#134e4a_55%,#0f172a_100%)]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-end p-6">
                    <p className="font-display text-3xl font-semibold tracking-tight text-white/90">
                      {item.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6 sm:p-7">
                <div className="pr-8">
                  <p className="text-xs font-medium tracking-wide text-primary uppercase">
                    {item.categoryName}
                  </p>
                  <DialogPrimitive.Title className="mt-1 font-display text-2xl font-semibold tracking-tight">
                    {item.name}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description?.trim()
                      ? item.description
                      : 'No description available for this item.'}
                  </DialogPrimitive.Description>
                </div>

                <div className="flex items-center justify-between border-t border-border/70 pt-4">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold tracking-tight">
                    {item.priceFormatted} {item.currency}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-xl bg-white/90 p-2 text-foreground shadow-sm backdrop-blur transition hover:bg-white">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
