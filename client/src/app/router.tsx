import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPlaceholderPage } from '@/pages/admin/DashboardPlaceholderPage'
import { LoginPlaceholderPage } from '@/pages/admin/LoginPlaceholderPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { MenuPlaceholderPage } from '@/pages/public/MenuPlaceholderPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPlaceholderPage />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<LoginPlaceholderPage />} />
        <Route path="/admin/dashboard" element={<DashboardPlaceholderPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
