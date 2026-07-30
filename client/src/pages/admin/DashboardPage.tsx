import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  EyeOff,
  FolderTree,
  QrCode,
  Store,
  UtensilsCrossed,
  CheckCircle2,
  AlertTriangle,
  Clock3,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { RecentActivityCard } from '@/features/activity/RecentActivityCard'
import { useAuth } from '@/features/auth/auth-context'
import { fetchDashboard } from '@/features/dashboard/api'
import { fetchQrPreview } from '@/features/qr/api'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime, formatRelativeTime, resolveMediaUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const quickActionDefs = [
  {
    segment: 'categories',
    title: 'Manage categories',
    description: 'Organize coffee, food, and seasonal sections.',
    icon: FolderTree,
  },
  {
    segment: 'menu',
    title: 'Edit menu items',
    description: 'Update prices, photos, and availability.',
    icon: UtensilsCrossed,
  },
  {
    segment: 'restaurant',
    title: 'Restaurant profile',
    description: 'Hours, contact details, logo, and cover.',
    icon: Store,
  },
  {
    segment: 'qr',
    title: 'QR & print',
    description: 'Download your permanent public menu code.',
    icon: QrCode,
  },
]

export function DashboardPage() {
  const { restaurantSlug } = useParams()
  const { owner } = useAuth()
  const slug = restaurantSlug ?? owner?.restaurantSlug ?? ''

  const quickActions = quickActionDefs.map((action) => ({
    ...action,
    to: `/${slug}/${action.segment}`,
  }))

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => fetchDashboard(5),
    staleTime: 30_000,
  })

  const qrQuery = useQuery({
    queryKey: ['admin', 'qr'],
    queryFn: fetchQrPreview,
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    // Defer non-critical QR until dashboard stats are ready.
    enabled: dashboardQuery.isSuccess,
  })

  if (dashboardQuery.isLoading) {
    return <DashboardSkeleton />
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Unable to load dashboard"
        description={getApiErrorMessage(dashboardQuery.error, 'Please refresh and try again.')}
        className="min-h-105 bg-white"
      />
    )
  }

  const { stats, restaurant, recentUpdates } = dashboardQuery.data
  const isLive = stats.restaurantStatus === 'ACTIVE'
  const logoUrl = resolveMediaUrl(restaurant.logo)

  const statsCards = [
    {
      label: 'Categories',
      value: stats.totalCategories,
      icon: FolderTree,
      tone: 'from-primary/15 to-primary/5 text-primary',
    },
    {
      label: 'Menu items',
      value: stats.totalMenuItems,
      icon: UtensilsCrossed,
      tone: 'from-secondary/15 to-secondary/5 text-secondary',
    },
    {
      label: 'Available',
      value: stats.availableItems,
      icon: CheckCircle2,
      tone: 'from-success/15 to-success/5 text-success',
    },
    {
      label: 'Hidden',
      value: stats.hiddenItems,
      icon: EyeOff,
      tone: 'from-accent/20 to-accent/5 text-amber-700',
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            {restaurant.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            A live snapshot of your digital menu performance, recent changes, and permanent QR
            access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isLive ? 'success' : 'warning'}>
            {isLive ? 'Menu live' : 'Maintenance mode'}
          </Badge>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
            <Clock3 className="h-3.5 w-3.5" />
            Updated {formatRelativeTime(stats.lastUpdated)}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-3xl border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgb(15_23_42/0.08)]"
          >
            <div
              className={cn(
                'mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br',
                card.tone,
              )}
            >
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{card.value}</p>
            <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-primary/5 transition group-hover:scale-110" />
          </div>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <motion.section
            variants={item}
            className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
                <p className="text-sm text-muted-foreground">Jump straight into daily operations.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group cursor-pointer rounded-2xl border border-border/70 bg-background p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-[0_12px_30px_rgb(16_185_129/0.12)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <action.icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{action.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </motion.section>

          <RecentActivityCard activities={recentUpdates} />
        </div>

        <div className="space-y-6">
          <motion.section
            variants={item}
            className="overflow-hidden rounded-[28px] border border-border/80 bg-white/90 shadow-[0_10px_40px_rgb(15_23_42/0.04)]"
          >
            <div className="border-b border-border/70 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold tracking-tight">Restaurant</h2>
              <p className="text-sm text-muted-foreground">Profile summary and public status.</p>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-border">
                  {logoUrl ? (
                    <img src={logoUrl} alt={`${restaurant.name} logo`} className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{restaurant.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {restaurant.address || 'Address not set yet'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl bg-background p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isLive ? 'success' : 'warning'}>
                    {restaurant.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{restaurant.phone || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="truncate font-medium">{restaurant.email || '—'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Last updated</span>
                  <span className="text-right font-medium">{formatDateTime(stats.lastUpdated)}</span>
                </div>
              </div>

              <Link
                to={`/${slug}/restaurant`}
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                Manage restaurant info
              </Link>
            </div>
          </motion.section>

          <motion.section
            variants={item}
            className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-tight">QR preview</h2>
              <p className="text-sm text-muted-foreground">
                Permanent code for your public menu URL.
              </p>
            </div>

            {qrQuery.isLoading ? (
              <Skeleton className="mx-auto h-56 w-56" />
            ) : qrQuery.isError || !qrQuery.data ? (
              <EmptyState
                icon={QrCode}
                title="QR unavailable"
                description={getApiErrorMessage(qrQuery.error, 'Could not load QR preview.')}
                className="border-none bg-background py-8"
              />
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-3xl border border-border bg-[radial-gradient(circle_at_top,#f0fdfa,#ffffff)] p-4 shadow-inner">
                  <img
                    src={qrQuery.data.pngDataUrl}
                    alt="Restaurant menu QR code"
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="truncate rounded-xl bg-background px-3 py-2 text-center text-xs text-muted-foreground">
                  {qrQuery.data.menuUrl}
                </p>
                <Link to={`/${slug}/qr`} className={cn(buttonVariants(), 'w-full')}>
                  <QrCode className="h-4 w-4" />
                  Open QR studio
                </Link>
              </div>
            )}
          </motion.section>
        </div>
      </div>
    </motion.div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-80" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-96" />
        </div>
      </div>
    </div>
  )
}
