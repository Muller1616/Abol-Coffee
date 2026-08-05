import { ensureCsrfToken } from '@/features/auth/api'
import { api, type ApiSuccess } from '@/lib/api'

export type ImageUploadVariant = 'menuItem' | 'logo' | 'cover'

type CloudinaryUploadSign =
  | {
      mode: 'unsigned'
      cloudName: string
      uploadPreset: string
      folder: string
    }
  | {
      mode: 'signed'
      cloudName: string
      apiKey: string
      timestamp: number
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

  const { data: signEnvelope } = await api.post<ApiSuccess<CloudinaryUploadSign>>(
    '/api/admin/uploads/cloudinary-sign',
    { variant },
  )
  const sign = signEnvelope.data

  const formData = new FormData()
  formData.append('file', file)

  if (sign.mode === 'unsigned') {
    formData.append('upload_preset', sign.uploadPreset)
    formData.append('folder', sign.folder)
  } else {
    formData.append('api_key', sign.apiKey)
    formData.append('timestamp', String(sign.timestamp))
    formData.append('signature', sign.signature)
    formData.append('public_id', sign.publicId)
  }

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
        const detail = payload.error?.message || `Cloudinary upload failed (${xhr.status})`
        reject(new Error(detail))
      } catch {
        reject(new Error(`Cloudinary upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Cloudinary upload network error'))
    xhr.send(formData)
  })

  return secureUrl
}
