import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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

type MenuPlacement = {
  openUp: boolean
  alignStart: boolean
}

const VIEWPORT_PAD = 12

export function ActionMenu({ label, items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<MenuPlacement>({
    openUp: false,
    alignStart: false,
  })
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useLayoutEffect(() => {
    if (!open) return

    const updatePlacement = () => {
      const trigger = rootRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return

      const triggerRect = trigger.getBoundingClientRect()
      const menuRect = menu.getBoundingClientRect()
      const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PAD
      const spaceAbove = triggerRect.top - VIEWPORT_PAD
      const openUp = spaceBelow < menuRect.height && spaceAbove > spaceBelow

      // Prefer right-aligned (menu grows left). Flip if that would clip the left edge.
      const wouldOverflowLeft = triggerRect.right - menuRect.width < VIEWPORT_PAD
      const wouldOverflowRight = triggerRect.left + menuRect.width > window.innerWidth - VIEWPORT_PAD
      const alignStart = wouldOverflowLeft && !wouldOverflowRight

      setPlacement({ openUp, alignStart })
    }

    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [open])

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
          ref={menuRef}
          id={menuId}
          role="menu"
          className={cn(
            'absolute z-30 max-w-[min(16rem,calc(100vw-1.5rem))] min-w-44 overflow-hidden rounded-2xl border border-border/80 bg-white py-1.5 shadow-[0_18px_50px_rgb(15_23_42/0.16)]',
            placement.openUp ? 'bottom-full mb-1' : 'top-full mt-1',
            placement.alignStart ? 'left-0' : 'right-0',
          )}
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
