import { motion } from 'framer-motion'
import { ShieldCheck, Settings, Layers, Coffee, DollarSign, ImagePlus, QrCode, RefreshCw, Smartphone, Zap, Lock, Sparkles } from 'lucide-react'

const CORE_FEATURES = [
  {
    icon: Lock,
    title: 'Secure Owner Login',
    description: 'Protected owner authentication with HttpOnly JWT cookies and CSRF security.',
  },
  {
    icon: Settings,
    title: 'Restaurant Settings',
    description: 'Manage opening hours, phone, location, logo, and cover hero photos anytime.',
  },
  {
    icon: Layers,
    title: 'Category Management',
    description: 'Create, reorder, and toggle visibility for sections like Coffee, Pastries, or Drinks.',
  },
  {
    icon: Coffee,
    title: 'Menu Item Management',
    description: 'Add dishes and beverages with titles, rich descriptions, and availability status.',
  },
  {
    icon: DollarSign,
    title: 'Price Management',
    description: 'Adjust prices in ETB instantly whenever ingredient or coffee bean costs change.',
  },
  {
    icon: ImagePlus,
    title: 'Image Upload',
    description: 'Upload vibrant food photos automatically converted and optimized to WebP.',
  },
  {
    icon: QrCode,
    title: 'QR Code Generation',
    description: 'Instantly generate high-resolution PNG & SVG vector files ready for table printing.',
  },
  {
    icon: ShieldCheck,
    title: 'Permanent QR Code',
    description: 'Print your QR code once — it directs customers to your live menu forever.',
  },
  {
    icon: RefreshCw,
    title: 'Real-Time Updates',
    description: 'All menu edits, price changes, and stock toggles sync to active guest sessions in 0.1s.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Friendly',
    description: 'Manage your restaurant comfortably from any laptop, tablet, or mobile smartphone.',
  },
  {
    icon: Zap,
    title: 'Fast Performance',
    description: 'Sub-second digital menu rendering engineered for high speed on mobile networks.',
  },
  {
    icon: Sparkles,
    title: 'Clean Guest Experience',
    description: 'Gives your diners a modern, elegant digital menu with zero app download friction.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#06120f] py-24 text-white sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-300"
          >
            <span>Platform Capabilities</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Core Features Built for Restaurant Operations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base text-white/70 sm:text-lg"
          >
            Everything you need to control your digital menu, manage pricing, and serve your customers seamlessly.
          </motion.p>
        </div>

        {/* 12 Feature Cards Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                whileHover={{ y: -4 }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/40 hover:bg-white/10"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-4 text-base font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/70">
                    {feature.description}
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
