import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ActionMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  tone?: 'default' | 'danger'
  onSelect: () => void
}

type ActionMenuProps = {
  label: string
  items: ActionMenuItem[]
  className?: string
}

export function ActionMenu({ label, items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target)) setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 min-w-44 overflow-hidden rounded-2xl border border-border/80 bg-white py-1.5 shadow-[0_18px_50px_rgb(15_23_42/0.16)]"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition',
                item.tone === 'danger'
                  ? 'text-danger hover:bg-danger/10'
                  : 'text-foreground hover:bg-muted',
              )}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
