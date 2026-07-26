import { motion } from 'framer-motion'
import { LogIn, Layers, PlusCircle, Printer, QrCode, RefreshCw } from 'lucide-react'

const OWNER_STEPS = [
  {
    step: '01',
    icon: LogIn,
    title: 'Log in as the Owner',
    description: 'Access your secure Abol Coffee owner console from any smartphone, tablet, or desktop browser.',
  },
  {
    step: '02',
    icon: Layers,
    title: 'Create Menu Categories',
    description: 'Organize your offering into clean categories such as Coffee, Pastries, Breakfast, or Specials.',
  },
  {
    step: '03',
    icon: PlusCircle,
    title: 'Add Food & Drink Items',
    description: 'Set prices in ETB, write tasty descriptions, upload dish photos, and set availability status.',
  },
  {
    step: '04',
    icon: Printer,
    title: 'Print Your Permanent QR Code',
    description: 'Download your high-res QR code and print it once for table stands, counter cards, and displays.',
  },
  {
    step: '05',
    icon: QrCode,
    title: 'Customers Scan & View Menu',
    description: 'Diners scan with their phone camera and instantly browse your clean, modern digital menu.',
  },
  {
    step: '06',
    icon: RefreshCw,
    title: 'Update Menu Anytime Without Replacing QR',
    description: 'Adjust prices or toggle sold-out items instantly. Your printed QR code never changes.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary"
          >
            <span>Simple Process</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base text-muted-foreground sm:text-lg"
          >
            Set up your restaurant digital menu in 6 simple steps and eliminate paper menu reprinting forever.
          </motion.p>
        </div>

        {/* 6 Steps Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {OWNER_STEPS.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative flex flex-col justify-between rounded-[28px] border border-border/80 bg-card p-8 shadow-[0_10px_40px_rgb(15_23_42/0.04)] transition-all duration-300 hover:border-primary/40 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl font-extrabold text-primary">
                      {item.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <h3 className="font-display mt-6 text-xl font-bold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
