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

      <div className="absolute inset-0">
        <video
          className="h-full w-full scale-105 object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/media/coffee-pour-poster.jpg"
          aria-hidden
        >
          <source src="/media/coffee-pour.mp4" type="video/mp4" />
        </video>

        {/* Readability layers — keep the pour visible while grounding the brand */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(6_18_15/0.35)_0%,rgb(6_18_15/0.45)_45%,rgb(6_18_15/0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgb(245_158_11/0.18),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgb(15_118_110/0.28),transparent_50%)]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-end px-6 pb-16 pt-20 sm:px-10 lg:justify-center lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-white"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm"
          >
            <Coffee className="h-5 w-5 text-accent" />
          </motion.div>

          <p className="font-display text-5xl font-semibold tracking-tight drop-shadow-[0_8px_30px_rgb(0_0_0/0.35)] sm:text-6xl lg:text-7xl">
            Abol Coffee
          </p>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white/95 sm:text-2xl">
            Restaurant QR digital menu
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
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
                'border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white',
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
