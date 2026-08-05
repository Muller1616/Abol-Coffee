import { ensureCsrfToken } from '@/features/auth/api'
import { api, type ApiSuccess } from '@/lib/api'

export type ImageUploadVariant = 'menuItem' | 'logo' | 'cover'

type CloudinarySign = {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  publicId: string
  signature: string
}

/**
 * Upload image bytes straight to Cloudinary (bypasses Vercel 4.5MB /api proxy limit).
 * Returns the permanent HTTPS delivery URL.
 */
export async function uploadFileToCloudinary(
  file: File,
  variant: ImageUploadVariant,
  onProgress?: (percent: number) => void,
): Promise<string> {
  await ensureCsrfToken()

  const { data: signEnvelope } = await api.post<ApiSuccess<CloudinarySign>>(
    '/api/admin/uploads/cloudinary-sign',
    { variant },
  )
  const sign = signEnvelope.data

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', sign.apiKey)
  formData.append('timestamp', String(sign.timestamp))
  formData.append('signature', sign.signature)
  formData.append('folder', sign.folder)
  formData.append('public_id', sign.publicId)

  const cloudUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`

  const secureUrl = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', cloudUrl)
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText) as {
          secure_url?: string
          error?: { message?: string }
        }
        if (xhr.status >= 200 && xhr.status < 300 && payload.secure_url) {
          resolve(payload.secure_url)
          return
        }
        reject(new Error(payload.error?.message || 'Cloudinary upload failed'))
      } catch {
        reject(new Error('Cloudinary upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Cloudinary upload network error'))
    xhr.send(formData)
  })

  return secureUrl
}
