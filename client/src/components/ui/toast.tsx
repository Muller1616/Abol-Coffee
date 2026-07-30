import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

type ToastItem = {
  id: string
  title: string
  tone: ToastTone
}

type ToastContextValue = {
  pushToast: (title: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneConfig: Record<
  ToastTone,
  { Icon: typeof CheckCircle2; border: string; iconClass: string }
> = {
  success: {
    Icon: CheckCircle2,
    border: 'border-success/20',
    iconClass: 'text-success',
  },
  error: {
    Icon: XCircle,
    border: 'border-danger/20',
    iconClass: 'text-danger',
  },
  warning: {
    Icon: AlertTriangle,
    border: 'border-accent/30',
    iconClass: 'text-accent',
  },
  info: {
    Icon: Info,
    border: 'border-primary/20',
    iconClass: 'text-primary',
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = useCallback((title: string, tone: ToastTone = 'success') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, title, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const { Icon, border, iconClass } = toneConfig[toast.tone]
            return (
              <motion.div
                key={toast.id}
                role="status"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_18px_50px_rgb(15_23_42/0.14)] backdrop-blur',
                  border,
                )}
              >
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} aria-hidden />
                <p className="text-sm font-medium text-foreground">{toast.title}</p>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
