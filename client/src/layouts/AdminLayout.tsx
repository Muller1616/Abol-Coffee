import { motion } from 'framer-motion'
import {
  Coffee,
  ExternalLink,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  LogOut,
  QrCode,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/menu-items', label: 'Menu items', icon: UtensilsCrossed },
  { to: '/admin/restaurant', label: 'Restaurant', icon: Store },
  { to: '/admin/qr', label: 'QR code', icon: QrCode },
  { to: '/admin/account', label: 'Settings', icon: KeyRound },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { owner, logout } = useAuth()
  const isDashboard = location.pathname === '/admin/dashboard'

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f4fbf9_0%,#f8fafc_40%,#f8fafc_100%)]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1440px]">
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-border/70 bg-white/70 px-5 py-6 backdrop-blur-xl lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(15_118_110/0.28)]">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Abol Coffee</p>
              <p className="text-xs text-muted-foreground">Owner console</p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[0_10px_24px_rgb(15_118_110/0.22)]'
                      : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-border/80 bg-white/80 p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Signed in
            </p>
            <p className="mt-1 truncate text-sm font-semibold">{owner?.email}</p>
            <Link
              to="/admin/account"
              className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
            >
              Change password
            </Link>
            <Button variant="outline" className="mt-3 h-10 w-full" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-white/75 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                {!isDashboard ? (
                  <BackLink
                    to="/admin/dashboard"
                    label="Back to dashboard"
                    tone="light"
                    className="h-10 w-10 shrink-0 lg:hidden"
                  />
                ) : null}
                <div className="lg:hidden">
                  <p className="text-sm font-semibold">Abol Coffee</p>
                  <p className="text-xs text-muted-foreground">Owner console</p>
                </div>
                <div className="hidden lg:block">
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground"
                  >
                    Manage your digital menu with clarity and speed.
                  </motion.p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'hidden text-muted-foreground sm:inline-flex',
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View site
                </Link>
                <Button variant="ghost" className="lg:hidden" onClick={() => void handleLogout()}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>

            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white text-muted-foreground ring-1 ring-border',
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
