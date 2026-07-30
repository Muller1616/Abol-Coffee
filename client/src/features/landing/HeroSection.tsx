import { motion } from 'framer-motion'
import { Coffee, QrCode, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { PublicMenuLink } from '@/features/public-menu/PublicMenuLink'
import { LandingContainer } from '@/features/landing/ui'
import { cn } from '@/lib/utils'

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-dvh overflow-hidden bg-brand-ink text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgb(16_185_129/0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_10%_90%,rgb(110_231_183/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgb(5_5_5)_100%)]" />
      </div>

      <LandingContainer className="relative flex min-h-dvh flex-col justify-center pt-28 pb-20 lg:pt-32 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6"
          >
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-accent uppercase">
              <Coffee className="h-3.5 w-3.5" />
              Digital menu platform
            </p>

            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-[4.75rem] lg:leading-[0.92]">
              Abol Coffee
            </h1>

            <p className="mt-4 font-display text-xl font-semibold tracking-tight text-balance text-white/90 sm:mt-5 sm:text-3xl">
              Your menu.{' '}
              <span className="text-primary">Always live.</span>
            </p>

            <p className="mt-4 max-w-md text-base leading-relaxed text-white/55 sm:mt-5 sm:text-lg">
              The modern QR menu for restaurants and cafés. Update prices once—every table stays
              current.
            </p>

            <div className="mt-10 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/login"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-14 w-full gap-2 px-8 text-base font-bold sm:w-auto',
                )}
              >
                Owner login
                <ArrowUpRight className="h-5 w-5" />
              </Link>
              <PublicMenuLink
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'lg' }),
                  'h-14 w-full border-white/15 bg-transparent px-7 text-white hover:border-white/30 hover:bg-white/5 hover:text-white sm:w-auto',
                )}
              >
                <QrCode className="h-5 w-5" />
                View live menu
              </PublicMenuLink>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-6"
          >
            <div className="relative mx-auto max-w-lg">
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-brand-ink-soft shadow-[0_40px_100px_rgb(0_0_0/0.55)]">
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />

                <div className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-xs font-medium tracking-wider text-white/40 uppercase">
                      Owner console
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-white">
                      Abol Coffee & Roastery
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1 text-[11px] font-bold text-accent ring-1 ring-primary/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Live
                  </span>
                </div>

                <div className="space-y-3 px-6 pb-6">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Items', value: '32' },
                      { label: 'Categories', value: '5' },
                      { label: 'Status', value: 'Open' },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-4"
                      >
                        <p className="text-[10px] tracking-wider text-white/35 uppercase">
                          {card.label}
                        </p>
                        <p className="mt-1 font-display text-xl font-bold text-white">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {[
                    { name: 'Special Macchiato', price: '150 ETB' },
                    { name: 'Jebena Traditional Brew', price: '180 ETB' },
                    { name: 'Butter Croissant', price: '120 ETB' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3.5"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        <p className="text-xs font-medium text-accent">{item.price}</p>
                      </div>
                      <span className="rounded-md bg-primary/15 px-2 py-1 text-[10px] font-bold text-primary">
                        Available
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.55 }}
                className="absolute -right-3 -bottom-5 hidden w-44 sm:block lg:-right-6"
              >
                <div className="rounded-[24px] border border-zinc-200 bg-white p-3.5 shadow-[0_24px_60px_rgb(0_0_0/0.35)]">
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-zinc-900">Guest menu</p>
                    <QrCode className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="space-y-2 rounded-xl bg-zinc-50 p-2.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Macchiato</span>
                      <span className="font-bold text-zinc-900">150</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">Jebena</span>
                      <span className="font-bold text-zinc-900">180</span>
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
