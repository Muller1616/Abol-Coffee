import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { RouteFallback } from '@/components/RouteFallback'
import { AdminLayout } from '@/layouts/AdminLayout'
import { LoginPage } from '@/pages/admin/LoginPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

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

const MenuPage = lazy(async () => {
  const mod = await import('@/pages/public/MenuPage')
  return { default: mod.MenuPage }
})

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/menu"
          element={
            <LazyPage>
              <MenuPage />
            </LazyPage>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route
            path="dashboard"
            element={
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            }
          />
          <Route
            path="categories"
            element={
              <LazyPage>
                <CategoriesPage />
              </LazyPage>
            }
          />
          <Route
            path="menu-items"
            element={
              <LazyPage>
                <MenuItemsPage />
              </LazyPage>
            }
          />
          <Route
            path="restaurant"
            element={
              <LazyPage>
                <RestaurantPage />
              </LazyPage>
            }
          />
          <Route
            path="qr"
            element={
              <LazyPage>
                <QrPage />
              </LazyPage>
            }
          />
          <Route
            path="account"
            element={
              <LazyPage>
                <AccountPage />
              </LazyPage>
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
