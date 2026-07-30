import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom'
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RequireRestaurantWorkspace } from '@/components/auth/RequireRestaurantWorkspace'
import { RouteFallback } from '@/components/RouteFallback'
import { SessionTimeoutProvider } from '@/features/auth/session/SessionTimeoutProvider'
import { useAuth } from '@/features/auth/auth-context'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { MenuNotFoundPage } from '@/pages/public/MenuNotFoundPage'

const AdminLayout = lazy(async () => {
  const mod = await import('@/layouts/AdminLayout')
  return { default: mod.AdminLayout }
})

const HomePage = lazy(async () => {
  const mod = await import('@/pages/HomePage')
  return { default: mod.HomePage }
})

const LoginPage = lazy(async () => {
  const mod = await import('@/pages/admin/LoginPage')
  return { default: mod.LoginPage }
})

const DashboardPage = lazy(async () => {
  const mod = await import('@/pages/admin/DashboardPage')
  return { default: mod.DashboardPage }
})

const CategoriesPage = lazy(async () => {
  const mod = await import('@/pages/admin/CategoriesPage')
  return { default: mod.CategoriesPage }
})

const MenuItemsPage = lazy(async () => {
  const mod = await import('@/pages/admin/MenuItemsPage')
  return { default: mod.MenuItemsPage }
})

const RestaurantPage = lazy(async () => {
  const mod = await import('@/pages/admin/RestaurantPage')
  return { default: mod.RestaurantPage }
})

const QrPage = lazy(async () => {
  const mod = await import('@/pages/admin/QrPage')
  return { default: mod.QrPage }
})

const AccountPage = lazy(async () => {
  const mod = await import('@/pages/admin/AccountPage')
  return { default: mod.AccountPage }
})

const ActivityPage = lazy(async () => {
  const mod = await import('@/pages/admin/ActivityPage')
  return { default: mod.ActivityPage }
})

const MenuPage = lazy(async () => {
  const mod = await import('@/pages/public/MenuPage')
  return { default: mod.MenuPage }
})

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

function LegacyAdminRedirect({ suffix = 'dashboard' }: { suffix?: string }) {
  const { owner, isLoading } = useAuth()
  if (isLoading) return <RouteFallback />
  if (owner?.restaurantSlug) {
    return <Navigate to={`/${owner.restaurantSlug}/${suffix}`} replace />
  }
  return <Navigate to="/login" replace />
}

function LegacyAdminCatchAll() {
  const params = useParams()
  const rest = params['*'] ?? 'dashboard'
  const first = rest.split('/')[0] || 'dashboard'
  const map: Record<string, string> = {
    dashboard: 'dashboard',
    categories: 'categories',
    'menu-items': 'menu',
    menu: 'menu',
    restaurant: 'restaurant',
    qr: 'qr',
    activity: 'activity',
    account: 'settings',
    settings: 'settings',
  }
  return <LegacyAdminRedirect suffix={map[first] ?? 'dashboard'} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LazyPage>
        <HomePage />
      </LazyPage>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyPage>
        <RedirectIfAuthenticated>
          <LoginPage />
        </RedirectIfAuthenticated>
      </LazyPage>
    ),
  },
  // Legacy /admin routes → new slug workspace (or login).
  { path: '/admin/login', element: <Navigate to="/login" replace /> },
  { path: '/admin', element: <LegacyAdminRedirect /> },
  { path: '/admin/*', element: <LegacyAdminCatchAll /> },
  {
    path: '/menu',
    element: <MenuNotFoundPage />,
  },
  {
    path: '/menu/:publicMenuToken',
    element: (
      <LazyPage>
        <MenuPage />
      </LazyPage>
    ),
    errorElement: <MenuNotFoundPage />,
  },
  {
    path: '/:restaurantSlug',
    element: (
      <RequireAuth>
        <RequireRestaurantWorkspace>
          <SessionTimeoutProvider>
            <Suspense fallback={<RouteFallback />}>
              <AdminLayout />
            </Suspense>
          </SessionTimeoutProvider>
        </RequireRestaurantWorkspace>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <LazyPage>
            <DashboardPage />
          </LazyPage>
        ),
      },
      {
        path: 'categories',
        element: (
          <LazyPage>
            <CategoriesPage />
          </LazyPage>
        ),
      },
      {
        path: 'menu',
        element: (
          <LazyPage>
            <MenuItemsPage />
          </LazyPage>
        ),
      },
      {
        path: 'restaurant',
        element: (
          <LazyPage>
            <RestaurantPage />
          </LazyPage>
        ),
      },
      {
        path: 'qr',
        element: (
          <LazyPage>
            <QrPage />
          </LazyPage>
        ),
      },
      {
        path: 'activity',
        element: (
          <LazyPage>
            <ActivityPage />
          </LazyPage>
        ),
      },
      {
        path: 'account',
        element: <Navigate to="../settings" replace />,
      },
      {
        path: 'settings',
        element: (
          <LazyPage>
            <AccountPage />
          </LazyPage>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
