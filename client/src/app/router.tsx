import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated } from '@/components/auth/RedirectIfAuthenticated'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AdminLayout } from '@/layouts/AdminLayout'
import { CategoriesPage } from '@/pages/admin/CategoriesPage'
import { ComingSoonPage } from '@/pages/admin/ComingSoonPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { MenuItemsPage } from '@/pages/admin/MenuItemsPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { MenuPlaceholderPage } from '@/pages/public/MenuPlaceholderPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPlaceholderPage />} />
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
          <Route
            path="restaurant"
            element={
              <ComingSoonPage
                title="Restaurant"
                description="Restaurant profile editing for branding, hours, contact, and maintenance status is next."
              />
            }
          />
          <Route
            path="qr"
            element={
              <ComingSoonPage
                title="QR code"
                description="A dedicated QR studio for preview, download, and print will arrive in an upcoming step."
              />
            }
          />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
