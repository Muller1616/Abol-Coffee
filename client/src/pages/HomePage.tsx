import { motion } from 'framer-motion'
import { ArrowRight, Coffee, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DocumentTitle } from '@/components/DocumentTitle'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <DocumentTitle title="Abol Coffee · Digital Menu" />

      <div className="absolute inset-0 bg-[linear-gradient(155deg,#0f766e_0%,#115e59_42%,#0f172a_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(245_158_11/0.22),transparent_42%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.1) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.1) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(circle at center, black, transparent 78%)',
        }}
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-end px-6 pb-16 pt-20 sm:px-10 lg:justify-center lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-white"
        >
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <Coffee className="h-5 w-5 text-accent" />
          </div>

          <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Abol Coffee
          </p>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white/95 sm:text-2xl">
            Restaurant QR digital menu
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Print one permanent QR code. Guests always see the latest menu — prices, photos, and
            availability update instantly.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/menu"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'bg-white text-[#0f172a] shadow-[0_16px_40px_rgb(0_0_0/0.28)] hover:bg-white/95',
              )}
            >
              <QrCode className="h-4 w-4" />
              View public menu
            </Link>
            <Link
              to="/admin/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white',
              )}
            >
              Owner console
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
