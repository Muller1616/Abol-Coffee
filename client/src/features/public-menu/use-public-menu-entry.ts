import { useQuery } from '@tanstack/react-query'
import { api, type ApiSuccess } from '@/lib/api'

export type PublicMenuEntry = {
  restaurantName: string
  restaurantSlug: string
  publicMenuToken: string
  menuUrl: string
  menuPath: string
}

export async function fetchPublicMenuEntry() {
  const { data } = await api.get<ApiSuccess<PublicMenuEntry>>('/api/public/menu/entry')
  return data.data
}

export function usePublicMenuEntry() {
  return useQuery({
    queryKey: ['public', 'menu-entry'],
    queryFn: fetchPublicMenuEntry,
    staleTime: 5 * 60_000,
  })
}
