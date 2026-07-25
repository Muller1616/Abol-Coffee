import { api, type ApiSuccess } from '@/lib/api'

export type QrPreview = {
  menuUrl: string
  pngDataUrl: string
  svg: string
  note: string
}

export async function fetchQrPreview() {
  const { data } = await api.get<ApiSuccess<QrPreview>>('/api/admin/qr')
  return data.data
}

export function getQrDownloadUrl(format: 'png' | 'svg') {
  const base = import.meta.env.VITE_API_URL?.trim() || ''
  return `${base}/api/admin/qr/${format}`
}
