import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AdminLayout } from '@/layouts/AdminLayout'
import { CategoriesPage } from '@/pages/admin/CategoriesPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { MenuItemsPage } from '@/pages/admin/MenuItemsPage'
import { QrPage } from '@/pages/admin/QrPage'
import { RestaurantPage } from '@/pages/admin/RestaurantPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { MenuPage } from '@/pages/public/MenuPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
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
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="menu-items" element={<MenuItemsPage />} />
          <Route path="restaurant" element={<RestaurantPage />} />
          <Route path="qr" element={<QrPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
