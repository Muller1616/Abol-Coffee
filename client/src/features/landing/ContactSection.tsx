import { motion } from 'framer-motion'
import { Phone, Mail, MapPin, Clock, QrCode, LogIn, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { PhoneContactLink } from '@/components/PhoneContactLink'
import { cn } from '@/lib/utils'

export function ContactSection() {
  return (
    <section id="contact" className="relative bg-[#06120f] py-24 text-white sm:py-32">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column: CTA Details */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300">
              <Store className="h-3.5 w-3.5" />
              <span>Get Started</span>
            </div>
            <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to Modernize Your Restaurant?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
              Manage your digital menu with ease and give your customers a better dining experience.
            </p>

            {/* Contact Information */}
            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/15">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Phone Support</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <PhoneContactLink
                      phone="+251 911 234 567"
                      className="text-sm font-semibold text-white hover:text-amber-300 transition cursor-pointer"
                      icon={null}
                    />
                    <span className="text-white/40">/</span>
                    <PhoneContactLink
                      phone="+251 922 345 678"
                      className="text-sm font-semibold text-white hover:text-amber-300 transition cursor-pointer"
                      icon={null}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-300 ring-1 ring-white/15">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">Email Support</h3>
                  <p className="mt-1 text-sm font-semibold text-white">support@abolcoffee.com / info@abolcoffee.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-300 ring-1 ring-white/15">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">Location</h3>
                  <p className="mt-1 text-sm font-semibold text-white">Bole Road, Friendship Building Area, Addis Ababa, Ethiopia</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal-300 ring-1 ring-white/15">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">Business Hours</h3>
                  <p className="mt-1 text-sm font-semibold text-white">Monday – Sunday: 7:00 AM – 10:00 PM EAT</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Final CTA Action Box */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="relative overflow-hidden rounded-4xl border border-white/15 bg-linear-to-br from-white/10 via-white/5 to-white/10 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-bold shadow-lg">
                <LogIn className="h-7 w-7" />
              </div>

              <h3 className="font-display mt-6 text-2xl font-bold tracking-tight text-white">
                Log In to Your Owner Dashboard
              </h3>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                Start updating prices, managing menu categories, and generating permanent QR codes for your tables today.
              </p>

              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
                <Link
                  to="/admin/login"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'h-14 flex-1 bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 font-bold text-slate-950 shadow-lg shadow-amber-400/20 hover:brightness-105',
                  )}
                >
                  <LogIn className="h-5 w-5" />
                  Owner Login
                </Link>
                <Link
                  to="/menu"
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'lg' }),
                    'h-14 flex-1 border-white/20 bg-white/10 font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white',
                  )}
                >
                  <QrCode className="h-5 w-5 text-emerald-400" />
                  View Live Menu
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
