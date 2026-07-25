import { motion } from 'framer-motion'
import { Coffee, Mail, MapPin, Phone } from 'lucide-react'
import type { PublicMenuMaintenance } from '@/features/public-menu/api'
import { resolveMediaUrl } from '@/lib/format'

type MaintenanceViewProps = {
  menu: PublicMenuMaintenance
}

export function MaintenanceView({ menu }: MaintenanceViewProps) {
  const { restaurant, message } = menu
  const logoUrl = resolveMediaUrl(restaurant.logo)

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#0f766e_0%,#134e4a_45%,#0f172a_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(245_158_11/0.18),transparent_45%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-lg text-center text-white"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/20">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Coffee className="h-7 w-7" />
          )}
        </div>

        <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          {restaurant.name}
        </p>
        <h1 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
          Temporarily unavailable
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
          {message}
        </p>

        {(restaurant.phone || restaurant.email || restaurant.address) && (
          <div className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm text-white/80">
            {restaurant.phone ? (
              <a
                href={`tel:${restaurant.phone}`}
                className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/12"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {restaurant.phone}
              </a>
            ) : null}
            {restaurant.email ? (
              <a
                href={`mailto:${restaurant.email}`}
                className="flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10 transition hover:bg-white/12"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {restaurant.email}
              </a>
            ) : null}
            {restaurant.address ? (
              <div className="flex items-start gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{restaurant.address}</span>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </main>
  )
}
