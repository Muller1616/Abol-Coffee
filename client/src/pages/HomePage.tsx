import { motion } from 'framer-motion'
import { Coffee, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-16">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-2xl border border-border/70 bg-card/80 p-8 shadow-[0_20px_60px_rgb(15_23_42/0.06)] backdrop-blur md:p-12"
      >
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Coffee className="h-6 w-6" />
        </div>
        <p className="mb-3 text-sm font-medium tracking-wide text-primary">Abol Coffee</p>
        <h1 className="font-display max-w-2xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Restaurant QR Digital Menu
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Frontend foundation is ready. Public menu and admin screens will be built next on this
          Vite + React + Tailwind stack.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/menu" className={cn(buttonVariants())}>
            <QrCode className="h-4 w-4" />
            Public menu
          </Link>
          <Link to="/admin/login" className={cn(buttonVariants({ variant: 'outline' }))}>
            Admin login
          </Link>
        </div>
      </motion.section>
    </main>
  )
}
