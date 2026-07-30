import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RouteFallback } from '@/components/RouteFallback'
import { SessionTimeoutProvider } from '@/features/auth/session/SessionTimeoutProvider'
import { NotFoundPage } from '@/pages/NotFoundPage'

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
    path: '/menu',
    element: (
      <LazyPage>
        <MenuPage />
      </LazyPage>
    ),
  },
  { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
  {
    path: '/admin/login',
    element: (
      <LazyPage>
        <RedirectIfAuthenticated>
          <LoginPage />
        </RedirectIfAuthenticated>
      </LazyPage>
    ),
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <SessionTimeoutProvider>
          <Suspense fallback={<RouteFallback />}>
            <AdminLayout />
          </Suspense>
        </SessionTimeoutProvider>
      </RequireAuth>
    ),
    children: [
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
        path: 'menu-items',
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
        path: 'account',
        element: (
          <LazyPage>
            <AccountPage />
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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
