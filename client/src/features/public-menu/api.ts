import axios from 'axios'
import type { OpeningHours } from '@/features/restaurant/types'
import { api, type ApiErrorBody, type ApiSuccess } from '@/lib/api'

export type PublicMenuItem = {
  id: string
  name: string
  description: string
  price: number
  priceFormatted: string
  currency: 'ETB'
  image: string | null
  isAvailable: true
  displayOrder: number
  categoryId: string
  categoryName: string
}

export type PublicCategory = {
  id: string
  name: string
  displayOrder: number
  items: PublicMenuItem[]
}

export type PublicRestaurant = {
  id: string
  name: string
  logo: string | null
  coverImage: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  description: string | null
  facebook: string | null
  instagram: string | null
  telegram: string | null
  openingHours: OpeningHours
  status: 'ACTIVE' | 'MAINTENANCE'
}

export type PublicMenuActive = {
  status: 'ACTIVE'
  restaurant: PublicRestaurant
  categories: PublicCategory[]
}

export type PublicMenuMaintenance = {
  status: 'MAINTENANCE'
  message: string
  restaurant: {
    id: string
    name: string
    logo: string | null
    phone: string | null
    email: string | null
    address: string | null
    description: string | null
  }
}

export type PublicMenu = PublicMenuActive | PublicMenuMaintenance

export async function fetchPublicMenu(): Promise<PublicMenu> {
  try {
    const { data } = await api.get<ApiSuccess<PublicMenuActive>>('/api/public/menu')
    return data.data
  } catch (error) {
    if (axios.isAxiosError<ApiErrorBody & { data?: PublicMenuMaintenance }>(error)) {
      const payload = error.response?.data
      if (error.response?.status === 503 && payload?.data?.status === 'MAINTENANCE') {
        return payload.data
      }
    }
    throw error
  }
}
