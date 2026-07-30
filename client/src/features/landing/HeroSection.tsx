import { motion } from 'framer-motion'
import { Coffee, LogIn, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { LandingContainer } from '@/features/landing/ui'
import { cn } from '@/lib/utils'

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-dvh overflow-hidden bg-brand-ink text-white"
    >
      {/* Full-bleed atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgb(15_118_110/0.35),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,rgb(92_64_51/0.35),transparent_45%)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(255 255 255 / 0.14) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.14) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
          }}
        />
      </div>

      <LandingContainer className="relative flex min-h-dvh flex-col justify-center pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-8 flex items-center gap-4"
            >
              <div className="relative">
                <div className="absolute -inset-2 rounded-[22px] bg-primary/40 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary text-primary-foreground shadow-[0_16px_40px_rgb(15_118_110/0.45)]">
                  <Coffee className="h-7 w-7" />
                </div>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Abol Coffee
                </p>
                <p className="mt-0.5 text-[11px] font-medium tracking-[0.22em] text-white/50 uppercase">
                  Digital menu platform
                </p>
              </div>
            </motion.div>

            <h1 className="font-display max-w-xl text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              Print once.
              <span className="mt-1 block text-primary">Update forever.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-white/65 sm:text-lg">
              Run your restaurant menu from one calm dashboard. Guests scan a permanent QR code and
              always see what’s live.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/admin/login"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-14 px-7 shadow-[0_18px_50px_rgb(15_118_110/0.4)]',
                )}
              >
                <LogIn className="h-5 w-5" />
                Owner login
              </Link>
              <Link
                to="/menu"
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-14 border-white/20 bg-white/5 px-7 text-white backdrop-blur-sm hover:border-white/30 hover:bg-white/10 hover:text-white',
                )}
              >
                <QrCode className="h-5 w-5" />
                View live menu
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-6"
          >
            {/* Layered product visual */}
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-6 rounded-[40px] bg-primary/15 blur-3xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-linear-to-b from-brand-ink-soft to-[#071614] shadow-[0_40px_100px_rgb(0_0_0/0.55)]">
                <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    </div>
                    <span className="text-xs font-medium text-white/70">Owner console</span>
                  </div>
                  <span className="rounded-full bg-primary/25 px-3 py-1 text-[10px] font-semibold tracking-wide text-primary uppercase ring-1 ring-primary/40">
                    Live sync
                  </span>
                </div>

                <div className="space-y-4 p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">Today’s menu</p>
                      <p className="text-sm text-white/45">Abol Coffee & Roastery</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl font-semibold text-primary">32</p>
                      <p className="text-[10px] tracking-wider text-white/40 uppercase">items</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['Coffee', 'Pastries', 'Juices'].map((cat) => (
                      <div
                        key={cat}
                        className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-center"
                      >
                        <p className="text-xs font-semibold text-white/85">{cat}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Special Macchiato', price: '150 ETB', status: 'Available' },
                      { name: 'Jebena Brew', price: '180 ETB', status: 'Available' },
                      { name: 'Butter Croissant', price: '120 ETB', status: 'Available' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + i * 0.08 }}
                        className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.045] px-4 py-3.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs font-medium text-primary">{item.price}</p>
                        </div>
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold text-primary">
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone peek — guest view, complementary not duplicate dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.6 }}
                className="absolute -right-2 -bottom-6 hidden w-40 sm:block lg:-right-4 lg:w-44"
              >
                <div className="overflow-hidden rounded-[28px] border border-white/15 bg-card p-3 shadow-[0_24px_60px_rgb(0_0_0/0.45)]">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-[10px] font-semibold text-foreground">Guest menu</p>
                    <QrCode className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="space-y-1.5 rounded-2xl bg-background p-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Macchiato</span>
                      <span className="font-semibold text-primary">150</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-muted-foreground">Jebena</span>
                      <span className="font-semibold text-primary">180</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </LandingContainer>
    </section>
  )
}
