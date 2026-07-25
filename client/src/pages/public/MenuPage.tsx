import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Coffee,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
} from 'lucide-react'
import { useDeferredValue, useMemo, useState, type ReactNode } from 'react'
import { DocumentTitle } from '@/components/DocumentTitle'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchPublicMenu, type PublicMenuItem } from '@/features/public-menu/api'
import { filterMenuCategories } from '@/features/public-menu/filter'
import { MaintenanceView } from '@/features/public-menu/MaintenanceView'
import { MenuItemModal } from '@/features/public-menu/MenuItemModal'
import {
  WEEKDAY_LABELS,
  WEEKDAYS,
  type OpeningHours,
} from '@/features/restaurant/types'
import { getApiErrorMessage } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3.1l.9-4H13V9c0-.6.4-1 1-1z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function MenuPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null)
  const deferredSearch = useDeferredValue(search)

  const menuQuery = useQuery({
    queryKey: ['public', 'menu'],
    queryFn: fetchPublicMenu,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    retry: (failureCount, error) => {
      if (getApiErrorMessage(error).toLowerCase().includes('maintenance')) return false
      return failureCount < 2
    },
  })

  const filteredCategories = useMemo(() => {
    if (!menuQuery.data || menuQuery.data.status !== 'ACTIVE') return []
    return filterMenuCategories(menuQuery.data.categories, {
      search: deferredSearch,
      categoryId,
    })
  }, [menuQuery.data, deferredSearch, categoryId])

  if (menuQuery.isLoading) {
    return (
      <div className="min-h-dvh bg-[#0b1f1c]">
        <Skeleton className="h-[100dvh] w-full rounded-none bg-white/10" />
      </div>
    )
  }

  if (menuQuery.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg items-center px-6 py-16">
        <EmptyState
          icon={AlertTriangle}
          title="Menu unavailable"
          description={getApiErrorMessage(menuQuery.error, 'Please try again in a moment.')}
          className="w-full bg-white"
        />
      </main>
    )
  }

  if (!menuQuery.data) return null

  if (menuQuery.data.status === 'MAINTENANCE') {
    return (
      <>
        <DocumentTitle title={`${menuQuery.data.restaurant.name} · Menu`} />
        <MaintenanceView menu={menuQuery.data} />
      </>
    )
  }

  const { restaurant, categories } = menuQuery.data
  const coverUrl = resolveMediaUrl(restaurant.coverImage)
  const logoUrl = resolveMediaUrl(restaurant.logo)
  const totalVisible = filteredCategories.reduce((sum, category) => sum + category.items.length, 0)

  return (
    <div className="min-h-dvh bg-[#f7faf9] text-foreground">
      <DocumentTitle title={`${restaurant.name} · Menu`} />
      <section className="relative min-h-dvh overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(155deg,#0f766e_0%,#115e59_40%,#0f172a_100%)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(6_18_15/0.25)_0%,rgb(6_18_15/0.35)_40%,rgb(6_18_15/0.88)_100%)]" />

        <div className="relative flex min-h-dvh flex-col justify-end px-6 pb-14 pt-20 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl text-white"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/25">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Coffee className="h-5 w-5" />
                )}
              </div>
            </div>

            <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              {restaurant.name}
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {restaurant.description?.trim() ||
                'Fresh flavors, crafted carefully — browse what’s available today.'}
            </p>

            <a
              href="#menu"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-semibold text-[#0f172a] shadow-[0_16px_40px_rgb(0_0_0/0.25)] transition hover:-translate-y-0.5"
            >
              Browse the menu
            </a>
          </motion.div>
        </div>
      </section>

      <div id="menu" className="relative scroll-mt-4">
        <div className="sticky top-0 z-30 border-b border-border/70 bg-[#f7faf9]/90 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or description"
                className="h-12 w-full rounded-2xl border border-border/80 bg-white pr-4 pl-11 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              <FilterChip
                label="All"
                active={categoryId === null}
                onClick={() => setCategoryId(null)}
              />
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  active={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          {totalVisible === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching items"
              description="Try another search term or category."
              className="min-h-[280px] bg-white"
            />
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((category, categoryIndex) => (
                <motion.section
                  key={category.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: Math.min(categoryIndex * 0.04, 0.2) }}
                >
                  <div className="mb-5">
                    <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {category.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  {category.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items in this category yet.</p>
                  ) : (
                    <ul className="divide-y divide-border/70 border-y border-border/70">
                      {category.items.map((item) => {
                        const imageUrl = resolveMediaUrl(item.image)
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="group flex w-full items-start gap-4 py-4 text-left transition hover:bg-white/70 sm:gap-5 sm:py-5"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="text-base font-semibold tracking-tight group-hover:text-primary sm:text-lg">
                                    {item.name}
                                  </h3>
                                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                                    {item.priceFormatted} ETB
                                  </p>
                                </div>
                                {item.description?.trim() ? (
                                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                    {item.description}
                                  </p>
                                ) : null}
                              </div>
                              {imageUrl ? (
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-24 sm:w-24">
                                  <img
                                    src={imageUrl}
                                    alt=""
                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                  />
                                </div>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </motion.section>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-border/70 bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">{restaurant.name}</p>
            {restaurant.description?.trim() ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                {restaurant.description}
              </p>
            ) : null}

            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              {restaurant.address ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {restaurant.address}
                </p>
              ) : null}
              {restaurant.phone ? (
                <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 hover:text-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  {restaurant.phone}
                </a>
              ) : null}
              {restaurant.email ? (
                <a
                  href={`mailto:${restaurant.email}`}
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  {restaurant.email}
                </a>
              ) : null}
            </div>

            <div className="mt-6 flex gap-2">
              {restaurant.facebook ? (
                <SocialLink href={restaurant.facebook} label="Facebook">
                  <FacebookIcon className="h-4 w-4" />
                </SocialLink>
              ) : null}
              {restaurant.instagram ? (
                <SocialLink href={restaurant.instagram} label="Instagram">
                  <InstagramIcon className="h-4 w-4" />
                </SocialLink>
              ) : null}
              {restaurant.telegram ? (
                <SocialLink href={restaurant.telegram} label="Telegram">
                  <Send className="h-4 w-4" />
                </SocialLink>
              ) : null}
            </div>
          </div>

          <OpeningHoursBlock hours={restaurant.openingHours} />
        </div>
      </footer>

      <MenuItemModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
      />
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-2xl px-3.5 py-2 text-sm font-medium transition',
        active
          ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(15_118_110/0.22)]'
          : 'bg-white text-muted-foreground ring-1 ring-border hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7faf9] text-foreground ring-1 ring-border transition hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </a>
  )
}

function OpeningHoursBlock({ hours }: { hours: OpeningHours }) {
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Opening hours
      </h3>
      <ul className="mt-4 space-y-2 text-sm">
        {WEEKDAYS.map((day) => {
          const dayHours = hours[day]
          return (
            <li key={day} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{WEEKDAY_LABELS[day]}</span>
              <span className="font-medium tabular-nums">
                {dayHours.isClosed
                  ? 'Closed'
                  : `${dayHours.open ?? '—'} – ${dayHours.close ?? '—'}`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
