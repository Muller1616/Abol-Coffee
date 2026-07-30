import { motion } from 'framer-motion'
import {
  QrCode,
  RefreshCw,
  ImagePlus,
  Layers,
  DollarSign,
  Smartphone,
} from 'lucide-react'
import {
  LandingCard,
  LandingContainer,
  LandingIconTile,
  LandingSection,
  LandingSectionHeader,
} from '@/features/landing/ui'

const FEATURES = [
  {
    icon: RefreshCw,
    title: 'Instant updates',
    description: 'Change a price or hide a sold-out item—every table sees it immediately.',
  },
  {
    icon: QrCode,
    title: 'Permanent QR code',
    description: 'Print once for stands and counters. Never reprint when the menu changes.',
  },
  {
    icon: Layers,
    title: 'Clear categories',
    description: 'Organize Coffee, Pastries, Juices, and specials the way your café actually runs.',
  },
  {
    icon: DollarSign,
    title: 'ETB pricing control',
    description: 'Adjust prices when bean or ingredient costs move—without touching paper.',
  },
  {
    icon: ImagePlus,
    title: 'Beautiful dish photos',
    description: 'Upload images that look sharp on phones, optimized automatically.',
  },
  {
    icon: Smartphone,
    title: 'Guest-ready menus',
    description: 'No app download. Guests scan and browse a clean digital menu in seconds.',
  },
]

export function FeaturesSection() {
  return (
    <LandingSection id="features" tone="ivory">
      <LandingContainer>
        <LandingSectionHeader
          eyebrow="Why owners switch"
          title="One system for the whole floor"
          description="Fewer tools. Fewer reprints. A calmer way to keep your menu accurate and your guests informed."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <LandingCard className="group h-full border-transparent bg-card/80 ring-1 ring-border/80 hover:ring-primary/25">
                  <LandingIconTile className="h-12 w-12 rounded-2xl transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </LandingIconTile>
                  <h3 className="font-display mt-5 text-lg font-semibold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </LandingCard>
              </motion.div>
            )
          })}
        </div>
      </LandingContainer>
    </LandingSection>
  )
}
