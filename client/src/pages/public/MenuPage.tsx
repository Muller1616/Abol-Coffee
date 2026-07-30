import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUp,
  Clock,
  Coffee,
  Grid,
  Info,
  List,
  MapPin,
  Search,
  Send,
  Sparkles,
  Share2,
  X,
  Check,
} from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BackLink } from '@/components/BackLink'
import { DocumentTitle } from '@/components/DocumentTitle'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { fetchPublicMenu, type PublicMenuItem } from '@/features/public-menu/api'
import { filterMenuCategories } from '@/features/public-menu/filter'
import { MaintenanceView } from '@/features/public-menu/MaintenanceView'
import { MenuItemModal } from '@/features/public-menu/MenuItemModal'
import { FindUsSection } from '@/features/public-menu/FindUsSection'
import { PhoneContactLink } from '@/components/PhoneContactLink'
import {
  WEEKDAY_LABELS,
  WEEKDAYS,
  type OpeningHours,
  type Weekday,
} from '@/features/restaurant/types'
import { getApiErrorMessage } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/format'
import { formatRestaurantAddress } from '@/lib/location'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import * as DialogPrimitive from '@radix-ui/react-dialog'

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
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('macchiato')) return '☕'
  if (lower.includes('breakfast') || lower.includes('egg') || lower.includes('morning')) return '🥐'
  if (lower.includes('burger') || lower.includes('sandwich') || lower.includes('wrap')) return '🍔'
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sweet')) return '🍰'
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice') || lower.includes('tea')) return '🥤'
  if (lower.includes('pizza') || lower.includes('pasta')) return '🍕'
  if (lower.includes('salad') || lower.includes('healthy')) return '🥗'
  return '🍽️'
}

function getTodayOpeningStatus(hours: OpeningHours): { isOpen: boolean; text: string } {
  const dayNames: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = dayNames[new Date().getDay()] ?? 'sunday'
  const dayHours = hours[today]

  if (!dayHours || dayHours.isClosed) {
    return { isOpen: false, text: 'Closed Today' }
  }

  const openTime = dayHours.open ?? '08:00'
  const closeTime = dayHours.close ?? '22:00'

  return { isOpen: true, text: `Open Today: ${openTime} – ${closeTime}` }
}

export function MenuPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [copiedMenuUrl, setCopiedMenuUrl] = useState(false)
  const { pushToast } = useToast()

  const deferredSearch = useDeferredValue(search)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const menuQuery = useQuery({
    queryKey: ['public', 'menu'],
    queryFn: fetchPublicMenu,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
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

  const handleCategorySelect = (id: string | null) => {
    setCategoryId(id)
    if (id) {
      const element = document.getElementById(`category-${id}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleShareMenu = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: menuQuery.data?.restaurant.name ?? 'Abol Coffee Menu',
          text: `Check out the digital menu for ${menuQuery.data?.restaurant.name ?? 'Abol Coffee'}!`,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopiedMenuUrl(true)
        pushToast('Menu link copied to clipboard!', 'success')
        setTimeout(() => setCopiedMenuUrl(false), 3000)
      }
    } catch {
      // User cancelled share dialog
    }
  }

  if (menuQuery.isLoading) {
    return (
      <div className="min-h-dvh bg-[#06120f] p-6 text-white">
        <div className="mx-auto max-w-3xl space-y-8 pt-12">
          <Skeleton className="h-44 w-full rounded-3xl bg-white/10" />
          <Skeleton className="h-12 w-full rounded-2xl bg-white/10" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-xl bg-white/10" />
            <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
            <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
            <Skeleton className="h-20 w-full rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (menuQuery.isError) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <BackLink tone="light" className="mb-6" />
        <EmptyState
          icon={AlertTriangle}
          title="Menu unavailable"
          description={getApiErrorMessage(menuQuery.error, 'Please try again in a moment.')}
          className="w-full bg-white shadow-xl rounded-3xl"
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
  const fullAddress = formatRestaurantAddress({
    address: restaurant.address,
    city: restaurant.city,
    state: restaurant.state,
    country: restaurant.country,
    postalCode: restaurant.postalCode,
  })
  const totalVisible = filteredCategories.reduce((sum, category) => sum + category.items.length, 0)
  const totalItemsCount = categories.reduce((sum, c) => sum + c.items.length, 0)
  const statusInfo = getTodayOpeningStatus(restaurant.openingHours)

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased selection:bg-amber-400 selection:text-slate-950">
      <DocumentTitle title={`${restaurant.name} · Digital QR Menu`} />

      {/* Hero Glassmorphic Header */}
      <section className="relative overflow-hidden bg-linear-to-b from-[#06120f] via-[#091f1a] to-[#06120f] text-white">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-25 filter blur-xs scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-[#06120f] via-[#0d2823] to-[#040e0c]" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#06120f] via-[#06120f]/85 to-[#06120f]/40" />

        <div className="relative mx-auto max-w-3xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between mb-5">
            <BackLink tone="dark" label="Home" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareMenu}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/15 hover:bg-white/20 transition cursor-pointer"
                title="Share or copy menu link"
              >
                {copiedMenuUrl ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-amber-300" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-amber-400/30">
                Live QR Menu
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Brand header — centered on all breakpoints */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-white p-1.5 shadow-2xl ring-2 ring-white/25">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={restaurant.name}
                    className="h-full w-full rounded-[18px] object-cover"
                  />
                ) : (
                  <Coffee className="h-9 w-9 text-primary" />
                )}
              </div>

              <div className="mt-4 min-w-0 w-full">
                <h1 className="font-display text-2xl font-extrabold tracking-tight text-balance text-white sm:text-3xl lg:text-4xl">
                  {restaurant.name}
                </h1>

                <div className="mt-2.5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowHoursModal(true)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold transition hover:brightness-110 cursor-pointer',
                      statusInfo.isOpen
                        ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                        : 'border-red-400/30 bg-red-500/20 text-red-300',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        statusInfo.isOpen ? 'animate-pulse bg-emerald-400' : 'bg-red-400',
                      )}
                    />
                    {statusInfo.text}
                    <Info className="h-3 w-3 opacity-70" />
                  </button>
                </div>

                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">
                  {restaurant.description?.trim() ||
                    'Handcrafted beverages and gourmet dining experience.'}
                </p>
              </div>
            </div>

            {/* Badges Bar: Address, Phone, Socials & Quick Stats */}
            <div className="flex flex-col items-center gap-3 text-xs text-white/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2.5">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {fullAddress ? (
                  <div className="flex max-w-full items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span className="truncate max-w-[220px] sm:max-w-xs">{fullAddress}</span>
                  </div>
                ) : null}
                {restaurant.phone && (
                  <PhoneContactLink
                    phone={restaurant.phone}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-white/90 backdrop-blur-md transition hover:bg-white/20 hover:text-white cursor-pointer"
                  />
                )}
                <div className="flex items-center gap-1">
                  {restaurant.facebook && (
                    <SocialLink href={restaurant.facebook} label="Facebook">
                      <FacebookIcon className="h-3.5 w-3.5" />
                    </SocialLink>
                  )}
                  {restaurant.instagram && (
                    <SocialLink href={restaurant.instagram} label="Instagram">
                      <InstagramIcon className="h-3.5 w-3.5" />
                    </SocialLink>
                  )}
                  {restaurant.telegram && (
                    <SocialLink href={restaurant.telegram} label="Telegram">
                      <Send className="h-3.5 w-3.5" />
                    </SocialLink>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-semibold text-white/60">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                  {categories.length} Categories
                </span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1">
                  {totalItemsCount} Total Items
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky Filter, Search & View Controls Header */}
      <div id="menu-section" className="sticky top-0 z-40 border-b border-white/10 bg-[#06120f]/95 px-4 py-3 text-white backdrop-blur-xl shadow-lg sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Instant Search Bar & Layout Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="h-11 w-full cursor-text rounded-2xl border border-white/15 bg-white/10 pr-10 pl-10 text-sm text-white placeholder-white/50 outline-none transition-all duration-200 focus:border-primary focus:bg-white/15"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/60 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Layout Toggle Pills */}
            <div className="flex items-center rounded-xl border border-white/10 bg-white/10 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-bold transition cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-white/70 hover:text-white',
                )}
                title="List view"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-bold transition cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-white/70 hover:text-white',
                )}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>

          {/* Search Result Counter Tag */}
          {search ? (
            <div className="flex items-center justify-between text-xs text-amber-300">
              <span>
                Found <strong>{totalVisible}</strong> {totalVisible === 1 ? 'item' : 'items'} matching &ldquo;{search}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[11px] underline text-white/70 hover:text-white cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          ) : null}

          {/* Category Horizontal Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => handleCategorySelect(null)}
              className={cn(
                'shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer min-h-11',
                categoryId === null
                  ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white',
              )}
            >
              All ({totalItemsCount})
            </button>
            {categories.map((category) => {
              const emoji = getCategoryEmoji(category.name)
              const isActive = categoryId === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  className={cn(
                    'shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer min-h-11',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white',
                  )}
                >
                  <span>{emoji}</span> {category.name}{' '}
                  <span
                    className={cn(
                      'text-[10px] opacity-75',
                      isActive ? 'font-extrabold text-primary-foreground' : 'text-white/60',
                    )}
                  >
                    ({category.items.length})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Luxury Printed / Modern Grid Menu View */}
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {totalVisible === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching dishes found"
            description="Try searching for a different dish name, price, or category."
            className="min-h-70 bg-white rounded-3xl border border-border/80 shadow-sm p-8"
          />
        ) : (
          <div className="space-y-14">
            {filteredCategories.map((category, categoryIndex) => (
              <motion.section
                key={category.id}
                id={`category-${category.id}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: Math.min(categoryIndex * 0.05, 0.2) }}
                className="scroll-mt-32"
              >
                {/* Category Header */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
                      <span>{getCategoryEmoji(category.name)}</span>
                      <span>{category.name}</span>
                    </h2>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {category.items.length} {category.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="mt-2 h-0.5 w-full bg-linear-to-r from-primary via-amber-400 to-transparent opacity-80" />
                </div>

                {/* Category Items List Mode (Printed Leader Line) */}
                {viewMode === 'list' ? (
                  <div className="space-y-5">
                    {category.items.map((item) => {
                      const imageUrl = resolveMediaUrl(item.image)
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="group cursor-pointer rounded-2xl p-2.5 transition-all duration-200 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-primary/20"
                        >
                          <div className="flex items-start gap-3.5">
                            {/* Thumbnail Image */}
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-xs border border-border/80 transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : null}

                            <div className="min-w-0 flex-1">
                              {/* Line Row: Item Name ····· Price (dotted leader on all breakpoints) */}
                              <div className="flex min-w-0 items-baseline gap-1.5 sm:gap-2">
                                <span className="min-w-0 shrink truncate font-bold tracking-tight text-foreground text-base transition-colors group-hover:text-primary sm:text-lg">
                                  {item.name}
                                </span>

                                <div
                                  className="mb-1 min-w-4 flex-1 self-baseline border-b-2 border-dotted border-slate-300/90"
                                  aria-hidden
                                />

                                <span className="shrink-0 rounded-lg border border-primary/10 bg-primary/5 px-2 py-0.5 font-extrabold tabular-nums text-primary text-sm sm:px-2.5 sm:text-base sm:text-lg">
                                  {item.priceFormatted}{' '}
                                  <span className="text-[10px] font-semibold text-primary/80 sm:text-xs">
                                    {item.currency}
                                  </span>
                                </span>
                              </div>

                              {/* Item Description */}
                              {item.description?.trim() ? (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm leading-relaxed">
                                  {item.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Category Items Grid Mode (Visual Cards) */
                  <div className="grid gap-4 sm:grid-cols-2">
                    {category.items.map((item) => {
                      const imageUrl = resolveMediaUrl(item.image)
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="group cursor-pointer flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
                        >
                          <div>
                            {imageUrl ? (
                              <div className="mb-3 aspect-16/10 overflow-hidden rounded-xl bg-slate-100">
                                <img
                                  src={imageUrl}
                                  alt={item.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                            ) : null}

                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                              <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-extrabold text-primary">
                                {item.priceFormatted} {item.currency}
                              </span>
                            </div>

                            {item.description?.trim() ? (
                              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-primary">
                            <span>Tap to view details</span>
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.section>
            ))}
          </div>
        )}
      </main>

      {/* Find Us — Google Map */}
      <section className="border-t border-white/10 bg-[#06120f] px-4 py-14 text-white sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <FindUsSection restaurant={restaurant} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#06120f] text-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <p className="text-center text-xs text-slate-500">
            © 2026 {restaurant.name}. Powered by Abol Coffee Digital Menu.
          </p>
        </div>
      </footer>

      {/* Back to Top Floating Action Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-xl hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Opening Hours Modal */}
      <DialogPrimitive.Root open={showHoursModal} onOpenChange={setShowHoursModal}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md transition-opacity" />
          <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[min(85dvh,640px)] w-full overflow-y-auto overscroll-contain rounded-t-3xl border border-white/20 bg-slate-900 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white shadow-2xl outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6 sm:pb-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25 sm:hidden" aria-hidden />
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <DialogPrimitive.Title className="font-display text-lg font-bold text-white">
                  Opening Hours
                </DialogPrimitive.Title>
              </div>
              <DialogPrimitive.Close className="flex h-11 w-11 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            <OpeningHoursBlock hours={restaurant.openingHours} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Item Detail Modal */}
      <MenuItemModal
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open: boolean) => {
          if (!open) setSelectedItem(null)
        }}
      />
    </div>
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
    >
      {children}
    </a>
  )
}

function OpeningHoursBlock({ hours }: { hours: OpeningHours }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 border border-white/10 text-xs w-full max-w-xs">
      <p className="font-bold text-amber-300 flex items-center gap-1.5 mb-2.5">
        <Clock className="h-3.5 w-3.5" /> Weekly Business Schedule
      </p>
      <div className="space-y-2 text-slate-300">
        {WEEKDAYS.map((day) => {
          const dayHours = hours[day]
          return (
            <div key={day} className="flex items-center justify-between gap-4">
              <span className="text-slate-400 capitalize">{WEEKDAY_LABELS[day]}</span>
              <span className="font-semibold tabular-nums">
                {dayHours.isClosed
                  ? 'Closed'
                  : `${dayHours.open ?? '—'} – ${dayHours.close ?? '—'}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
