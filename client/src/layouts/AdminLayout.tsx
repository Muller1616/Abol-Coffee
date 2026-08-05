import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Coffee,
  ExternalLink,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Store,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { prefetchAdminRoutes } from '@/app/prefetch'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

type NavItem = {
  segment: string
  label: string
  icon: typeof LayoutDashboard
  prefetch: () => Promise<unknown>
}

const navDefinitions: NavItem[] = [
  { segment: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, prefetch: () => import('@/pages/admin/DashboardPage') },
  { segment: 'categories', label: 'Categories', icon: FolderTree, prefetch: () => import('@/pages/admin/CategoriesPage') },
  { segment: 'menu', label: 'Menu items', icon: UtensilsCrossed, prefetch: () => import('@/pages/admin/MenuItemsPage') },
  { segment: 'restaurant', label: 'Restaurant', icon: Store, prefetch: () => import('@/pages/admin/RestaurantPage') },
  { segment: 'qr', label: 'QR code', icon: QrCode, prefetch: () => import('@/pages/admin/QrPage') },
  { segment: 'activity', label: 'Activity', icon: Activity, prefetch: () => import('@/pages/admin/ActivityPage') },
  { segment: 'settings', label: 'Settings', icon: KeyRound, prefetch: () => import('@/pages/admin/AccountPage') },
]

function NavItems({
  slug,
  onNavigate,
  className,
}: {
  slug: string
  onNavigate?: () => void
  className?: string
}) {
  return (
    <nav className={cn('flex flex-col gap-1.5', className)}>
      {navDefinitions.map((item) => (
        <NavLink
          key={item.segment}
          to={`/${slug}/${item.segment}`}
          onClick={onNavigate}
          onMouseEnter={() => {
            void item.prefetch()
          }}
          onFocus={() => {
            void item.prefetch()
          }}
          className={({ isActive }) =>
            cn(
              'group flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary font-semibold text-primary-foreground shadow-[0_10px_24px_rgb(16_185_129/0.22)]'
                : 'text-muted-foreground hover:translate-x-1 hover:bg-primary/10 hover:text-primary',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { restaurantSlug } = useParams()
  const { owner, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const slug = restaurantSlug ?? owner?.restaurantSlug ?? ''
  const liveMenuPath = owner?.publicMenuUrl
    ? new URL(owner.publicMenuUrl).pathname
    : owner?.publicMenuToken
      ? `/menu/${owner.publicMenuToken}`
      : '/menu'

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      prefetchAdminRoutes()
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const activeLabel = useMemo(() => {
    const match = navDefinitions.find((item) =>
      location.pathname.startsWith(`/${slug}/${item.segment}`),
    )
    return match?.label ?? 'Console'
  }, [location.pathname, slug])

  if (!slug) return null

  return (
    <div className="min-h-dvh overflow-x-clip bg-[linear-gradient(180deg,#f4f4f5_0%,#fafafa_45%,#f4f4f5_100%)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-full">
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-border/70 bg-white/80 px-5 py-6 backdrop-blur-xl lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(16_185_129/0.28)]">
              <Coffee className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">Abol Coffee</p>
              <p className="truncate text-xs text-muted-foreground">/{slug}</p>
            </div>
          </div>

          <NavItems slug={slug} className="flex-1" />

          <div className="mt-6 rounded-2xl border border-border/80 bg-white/80 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Signed in
            </p>
            <p className="mt-1 truncate text-sm font-semibold">{owner?.email}</p>
            <Button
              variant="outline"
              className="mt-3 h-11 w-full"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-white/85 px-3 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 lg:hidden"
                  aria-label="Open navigation menu"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="min-w-0 lg:hidden">
                  <p className="truncate text-sm font-semibold">Abol Coffee</p>
                  <p className="truncate text-xs text-muted-foreground">{activeLabel}</p>
                </div>
                <p className="hidden truncate text-sm text-muted-foreground lg:block">
                  Manage your digital menu with clarity and speed.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                <Link
                  to={liveMenuPath}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'hidden text-muted-foreground sm:inline-flex',
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Live menu
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground lg:hidden"
                  aria-label="Sign out"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Owner navigation">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 animate-[toast-in_180ms_ease-out] bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-dvh w-[min(100vw-3rem,20rem)] max-w-full translate-x-0 animate-[drawer-in_220ms_ease-out] flex-col border-r border-border/80 bg-white shadow-[0_30px_80px_rgb(15_23_42/0.28)]">
            <div className="flex h-full min-w-0 flex-col px-4 py-6 sm:px-5">
              <div className="mb-8 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(16_185_129/0.28)]">
                    <Coffee className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-tight">Abol Coffee</p>
                    <p className="truncate text-xs text-muted-foreground">{owner?.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <NavItems slug={slug} onNavigate={() => setMobileOpen(false)} className="min-h-0 flex-1 overflow-y-auto" />

              <div className="mt-6 space-y-2 border-t border-border/70 pt-4">
                <Link
                  to={liveMenuPath}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-11 w-full justify-center',
                  )}
                >
                  <ExternalLink className="h-4 w-4" />
                  View live menu
                </Link>
                <Button
                  variant="outline"
                  className="h-11 w-full"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
