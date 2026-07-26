import { motion } from 'framer-motion'
import { RefreshCw, QrCode, LayoutDashboard, Smartphone, DollarSign, Laptop, Check, X } from 'lucide-react'

const BUSINESS_BENEFITS = [
  {
    icon: RefreshCw,
    title: 'Real-Time Menu Updates',
    description: 'Update prices, descriptions, or menu items instantly. Changes reflect immediately on every table.',
    color: 'from-amber-500/20 to-orange-500/10 text-amber-600',
  },
  {
    icon: QrCode,
    title: 'Permanent QR Code',
    description: 'Print your QR code once. Customers always see your latest menu automatically without replacing prints.',
    color: 'from-emerald-500/20 to-teal-500/10 text-emerald-600',
  },
  {
    icon: LayoutDashboard,
    title: 'Easy Menu Management',
    description: 'Create categories, upload high-res images, edit prices in ETB, and organize your menu effortlessly.',
    color: 'from-primary/20 to-teal-500/10 text-primary',
  },
  {
    icon: Smartphone,
    title: 'Professional Customer Experience',
    description: 'Give customers a clean, modern digital menu formatted perfectly for any smartphone browser.',
    color: 'from-teal-500/20 to-emerald-500/10 text-teal-600',
  },
  {
    icon: DollarSign,
    title: 'Save Printing Costs',
    description: 'No more reprinting paper menus whenever prices change, items sell out, or new coffee beans arrive.',
    color: 'from-amber-500/20 to-yellow-500/10 text-amber-600',
  },
  {
    icon: Laptop,
    title: 'Works on Any Device',
    description: 'Manage your restaurant from your laptop, tablet, or mobile phone anytime, anywhere.',
    color: 'from-emerald-500/20 to-primary/10 text-emerald-600',
  },
]

const TRADITIONAL_POINTS = [
  'Expensive to print and laminate whenever prices change',
  'Difficult & slow to update when coffee or ingredient costs shift',
  'Wasted paper, torn cards, and environmental waste',
  'Old, outdated prices remain visible to disappointed diners',
  'Poor customer experience when sold-out items are ordered',
]

const DIGITAL_POINTS = [
  'Instant updates in 0.1s directly from your owner dashboard',
  'Permanent QR code — print once and use on tables forever',
  'Modern, interactive experience with rich food images',
  'Eco-friendly, 100% paperless digital solution',
  'No reprinting costs when coffee bean or food prices change',
]

export function TrustSection() {
  return (
    <section id="why-us" className="relative bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary"
          >
            <span>Value Proposition</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            Why Restaurant Owners Choose This System
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base text-muted-foreground sm:text-lg"
          >
            Built specifically to solve paper menu costs, tedious price adjustments, and customer frustration.
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-[28px] border border-border/80 bg-card p-8 shadow-[0_10px_40px_rgb(15_23_42/0.04)] transition-all duration-300 hover:border-primary/40 hover:shadow-xl"
              >
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${benefit.color} ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="font-display mt-6 text-xl font-bold tracking-tight text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>

                <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-primary via-amber-500 to-emerald-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </motion.div>
            )
          })}
        </div>

        {/* Comparison Block */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2">
          {/* Traditional Paper Menu */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-4xl border border-red-200/80 bg-red-50/40 p-8 shadow-xs sm:p-10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <X className="h-5 w-5" />
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Traditional Paper Menu
              </h3>
            </div>

            <ul className="mt-8 space-y-4">
              {TRADITIONAL_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-700">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Digital QR Menu */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-4xl border-2 border-primary bg-linear-to-br from-[#06120f] via-[#0d2823] to-[#06120f] p-8 text-white shadow-2xl sm:p-10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                Digital QR Menu
              </h3>
            </div>

            <ul className="mt-8 space-y-4">
              {DIGITAL_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-3.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-white/90">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
