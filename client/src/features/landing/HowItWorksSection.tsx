import { motion } from 'framer-motion'
import { LogIn, UtensilsCrossed, QrCode, Sparkles } from 'lucide-react'
import {
  LandingContainer,
  LandingSection,
  LandingSectionHeader,
} from '@/features/landing/ui'

const STEPS = [
  {
    step: '01',
    icon: LogIn,
    title: 'Sign in',
    description: 'Open your secure owner console from any device.',
  },
  {
    step: '02',
    icon: UtensilsCrossed,
    title: 'Build the menu',
    description: 'Add categories, items, prices, and photos in minutes.',
  },
  {
    step: '03',
    icon: QrCode,
    title: 'Print your QR',
    description: 'Download once for tables, counters, and windows.',
  },
  {
    step: '04',
    icon: Sparkles,
    title: 'Stay current',
    description: 'Update anytime. The printed code never changes.',
  },
]

export function HowItWorksSection() {
  return (
    <LandingSection id="how-it-works" tone="white">
      <LandingContainer>
        <LandingSectionHeader
          eyebrow="Simple path"
          title="Live in four steps"
          description="From empty console to tables scanning your menu—without a complicated setup."
        />

        <div className="relative mt-16">
          <div className="pointer-events-none absolute top-10 right-0 left-0 hidden h-px bg-linear-to-r from-transparent via-border to-transparent lg:block" />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.07 }}
                  className="relative text-center lg:text-left"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_14px_36px_rgb(16_185_129/0.35)] lg:mx-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-[11px] font-semibold tracking-[0.2em] text-primary uppercase">
                    Step {item.step}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </LandingContainer>
    </LandingSection>
  )
}
