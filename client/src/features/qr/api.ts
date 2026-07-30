import { ensureCsrfToken } from '@/features/auth/api'
import { api, type ApiSuccess } from '@/lib/api'

export type QrPreview = {
  menuUrl: string
  pngDataUrl: string
  note?: string
  isLocalhostUrl?: boolean
  publicMenuToken?: string
  restaurantSlug?: string
}

export async function fetchQrPreview() {
  const { data } = await api.get<ApiSuccess<QrPreview>>('/api/admin/qr')
  return data.data
}

export async function regeneratePublicMenuToken() {
  await ensureCsrfToken()
  const { data } = await api.post<
    ApiSuccess<{ restaurantSlug: string; publicMenuToken: string; menuUrl: string }>
  >('/api/admin/qr/regenerate-token')
  return data.data
}

export function getQrDownloadUrl(format: 'png' | 'svg') {
  const base = import.meta.env.VITE_API_URL?.trim() || ''
  return `${base}/api/admin/qr/${format}`
}
