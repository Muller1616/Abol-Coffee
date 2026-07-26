import { motion } from 'framer-motion'
import { QrCode, LogIn, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-dvh overflow-hidden bg-[#06120f] pt-28 pb-20 text-white lg:pt-36 lg:pb-32">
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-amber-500/15 blur-[120px]" />
        <div className="absolute bottom-10 left-1/2 h-80 w-150 -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-8">
          {/* Left Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            {/* Headline */}
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Manage Your Restaurant Menu with{' '}
              <span className="bg-linear-to-r from-amber-300 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                One Simple Dashboard
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Easily manage your restaurant menu, categories, prices, images, and restaurant information from a secure dashboard. Customers simply scan one permanent QR code to always view your latest menu.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/admin/login"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-14 bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 px-8 text-base font-bold text-slate-950 shadow-xl shadow-amber-400/20 transition-all hover:scale-[1.02] hover:brightness-105',
                )}
              >
                <LogIn className="h-5 w-5" />
                Owner Login
              </Link>
              <Link
                to="/menu"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-14 border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/10 hover:text-white',
                )}
              >
                <QrCode className="h-5 w-5 text-emerald-400" />
                View Live Menu
              </Link>
            </div>
          </motion.div>

          {/* Right Composite Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-5"
          >
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              {/* Owner Dashboard Mockup Window */}
              <div className="relative z-10 overflow-hidden rounded-3xl border-2 border-white/20 bg-[#0d221e] p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                {/* Control Bar */}
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400/80" />
                    <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 text-xs font-bold text-white/80">Owner Console</span>
                  </div>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                    Live Sync Active
                  </span>
                </div>

                {/* Dashboard Inner UI Preview */}
                <div className="space-y-3 rounded-2xl bg-slate-900 p-3.5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Abol Coffee & Roastery</p>
                      <p className="text-[10px] text-white/60">Manage items, prices & categories</p>
                    </div>
                    <span className="rounded-lg bg-amber-400/20 px-2 py-1 text-[10px] font-bold text-amber-300">
                      32 Active Items
                    </span>
                  </div>

                  {/* Row 1 */}
                  <div className="flex items-center justify-between rounded-xl bg-white/10 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">☕</span>
                      <div>
                        <p className="font-bold text-white">Special Macchiato</p>
                        <p className="text-[10px] text-amber-300 font-semibold">150 ETB</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      In Stock
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center justify-between rounded-xl bg-white/10 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">𫞂</span>
                      <div>
                        <p className="font-bold text-white">Jebena Traditional Brew</p>
                        <p className="text-[10px] text-amber-300 font-semibold">180 ETB</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      In Stock
                    </span>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center justify-between rounded-xl bg-white/10 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🥐</span>
                      <div>
                        <p className="font-bold text-white">Butter Croissant</p>
                        <p className="text-[10px] text-amber-300 font-semibold">120 ETB</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      In Stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Permanent QR Card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-6 -left-6 z-20 hidden rounded-2xl border border-white/20 bg-[#06120f]/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:block"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1 shadow-md">
                    <QrCode className="h-9 w-9 text-slate-900" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">Permanent Table QR</p>
                    <p className="text-[10px] text-white/70">Print once • Directs to live menu</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Guest Mobile View Card */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -top-6 -right-6 z-20 hidden rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-white shadow-2xl backdrop-blur-xl sm:block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">Guest Mobile View</p>
                    <p className="text-[10px] text-white/70">Instant 0.1s sync</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
