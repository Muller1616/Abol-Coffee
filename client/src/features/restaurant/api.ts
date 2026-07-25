import { ensureCsrfToken } from '@/features/auth/api'
import type { OpeningHours } from '@/features/restaurant/types'
import { api, type ApiSuccess } from '@/lib/api'

export type Restaurant = {
  id: string
  name: string
  logo: string | null
  coverImage: string | null
  address: string | null
  phone: string | null
  email: string | null
  openingHours: OpeningHours
  description: string | null
  facebook: string | null
  instagram: string | null
  telegram: string | null
  status: 'ACTIVE' | 'MAINTENANCE'
  createdAt: string
  updatedAt: string
}

export type UpdateRestaurantInput = {
  name?: string
  address?: string | null
  phone?: string | null
  email?: string | null
  description?: string | null
  facebook?: string | null
  instagram?: string | null
  telegram?: string | null
  openingHours?: OpeningHours
  status?: 'ACTIVE' | 'MAINTENANCE'
}

export async function fetchRestaurant() {
  const { data } = await api.get<ApiSuccess<{ restaurant: Restaurant }>>('/api/admin/restaurant')
  return data.data.restaurant
}

export async function updateRestaurant(input: UpdateRestaurantInput) {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ restaurant: Restaurant }>>(
    '/api/admin/restaurant',
    input,
  )
  return data.data.restaurant
}

export async function updateRestaurantStatus(status: 'ACTIVE' | 'MAINTENANCE') {
  await ensureCsrfToken()
  const { data } = await api.patch<ApiSuccess<{ restaurant: Restaurant }>>(
    '/api/admin/restaurant/status',
    { status },
  )
  return data.data.restaurant
}

export async function uploadRestaurantLogo(file: File) {
  await ensureCsrfToken()
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post<ApiSuccess<{ restaurant: Restaurant }>>(
    '/api/admin/restaurant/logo',
    formData,
  )
  return data.data.restaurant
}

export async function removeRestaurantLogo() {
  await ensureCsrfToken()
  const { data } = await api.delete<ApiSuccess<{ restaurant: Restaurant }>>(
    '/api/admin/restaurant/logo',
  )
  return data.data.restaurant
}

export async function uploadRestaurantCover(file: File) {
  await ensureCsrfToken()
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post<ApiSuccess<{ restaurant: Restaurant }>>(
    '/api/admin/restaurant/cover',
    formData,
  )
  return data.data.restaurant
}

export async function removeRestaurantCover() {
  await ensureCsrfToken()
  const { data } = await api.delete<ApiSuccess<{ restaurant: Restaurant }>>(
    '/api/admin/restaurant/cover',
  )
  return data.data.restaurant
}
