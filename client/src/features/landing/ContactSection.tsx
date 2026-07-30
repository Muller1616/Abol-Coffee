import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, QrCode, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { PhoneContactLink } from '@/components/PhoneContactLink'
import {
  LandingContainer,
  LandingIconTile,
  LandingSection,
} from '@/features/landing/ui'
import { cn } from '@/lib/utils'

export function ContactSection() {
  return (
    <LandingSection id="contact" tone="ivory" className="pb-24">
      <LandingContainer>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[36px] bg-brand-ink px-6 py-12 text-white shadow-[0_40px_100px_rgb(10_31_28/0.35)] sm:px-10 sm:py-14 lg:px-14"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-primary/30 blur-[100px]" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-secondary/25 blur-[90px]" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
                Get started
              </p>
              <h2 className="font-display mt-3 max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Your menu, always ready for the next guest.
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/60">
                Log in to manage prices and categories—or open the live guest menu and see what
                diners experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/admin/login"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'h-14 justify-center px-8 shadow-[0_18px_50px_rgb(15_118_110/0.45)]',
                  )}
                >
                  <LogIn className="h-5 w-5" />
                  Owner login
                </Link>
                <Link
                  to="/menu"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'h-14 justify-center border-white/20 bg-white/5 px-8 text-white hover:bg-white/10 hover:text-white',
                  )}
                >
                  <QrCode className="h-5 w-5" />
                  View live menu
                </Link>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-5">
              {[
                {
                  icon: Phone,
                  label: 'Phone',
                  body: (
                    <PhoneContactLink
                      phone="+251 911 234 567"
                      className="text-sm font-semibold text-white transition hover:text-primary"
                      icon={null}
                    />
                  ),
                },
                {
                  icon: Mail,
                  label: 'Email',
                  body: (
                    <p className="text-sm font-semibold text-white">support@abolcoffee.com</p>
                  ),
                },
                {
                  icon: MapPin,
                  label: 'Visit',
                  body: (
                    <p className="text-sm font-semibold text-white">
                      Bole Road, Addis Ababa, Ethiopia
                    </p>
                  ),
                },
              ].map((row) => {
                const Icon = row.icon
                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
                  >
                    <LandingIconTile className="bg-primary/20 text-primary">
                      <Icon className="h-5 w-5" />
                    </LandingIconTile>
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider text-white/45 uppercase">
                        {row.label}
                      </p>
                      <div className="mt-0.5">{row.body}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </LandingContainer>
    </LandingSection>
  )
}
