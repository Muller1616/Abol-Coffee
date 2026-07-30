import type { AdminActivity } from '@/features/activity/api'
import { api, type ApiSuccess } from '@/lib/api'

export type DashboardData = {
  stats: {
    totalCategories: number
    totalMenuItems: number
    availableItems: number
    hiddenItems: number
    lastUpdated: string | null
    restaurantStatus: 'ACTIVE' | 'MAINTENANCE'
  }
  restaurant: {
    id: string
    name: string
    logo: string | null
    coverImage: string | null
    status: 'ACTIVE' | 'MAINTENANCE'
    phone: string | null
    email: string | null
    address: string | null
  }
  recentUpdates: AdminActivity[]
}

export async function fetchDashboard(recentLimit = 5) {
  const { data } = await api.get<ApiSuccess<DashboardData>>('/api/admin/dashboard', {
    params: { recentLimit },
  })
  return data.data
}
