export type CompressImageOptions = {
  /** Max longest edge in pixels. */
  maxDimension?: number;
  /** WebP quality 0–1. */
  quality?: number;
  /** Skip compression below this size (bytes). */
  minBytesToCompress?: number;
};

const DEFAULTS: Required<CompressImageOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  minBytesToCompress: 200 * 1024,
}

/**
 * Client-side resize + WebP encode before upload.
 * Cuts upload payload dramatically for phone camera photos.
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const { maxDimension, quality, minBytesToCompress } = { ...DEFAULTS, ...options }

  if (!file.type.startsWith('image/') || file.size < minBytesToCompress) {
    return file
  }

  // Prefer createImageBitmap when available (faster decode on modern browsers).
  let bitmap: ImageBitmap | null = null
  let objectUrl: string | null = null

  try {
    if (typeof createImageBitmap === 'function') {
      bitmap = await createImageBitmap(file)
    }

    const sourceWidth = bitmap?.width
    const sourceHeight = bitmap?.height

    if (!bitmap) {
      objectUrl = URL.createObjectURL(file)
      const img = await loadHtmlImage(objectUrl)
      return await encodeResized(img, img.naturalWidth, img.naturalHeight, file, maxDimension, quality)
    }

    return await encodeResized(bitmap, sourceWidth!, sourceHeight!, file, maxDimension, quality)
  } catch {
    return file
  } finally {
    bitmap?.close()
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to decode image'))
    img.src = src
  })
}

async function encodeResized(
  source: CanvasImageSource,
  width: number,
  height: number,
  original: File,
  maxDimension: number,
  quality: number,
): Promise<File> {
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const targetW = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) return original

  ctx.drawImage(source, 0, 0, targetW, targetH)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/webp', quality)
  })

  if (!blob || blob.size >= original.size) {
    return original
  }

  const baseName = original.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}

/** Logo: smaller max edge. Cover: wider. Menu: default. */
export function compressOptionsForVariant(
  variant: 'logo' | 'cover' | 'menuItem',
): CompressImageOptions {
  switch (variant) {
    case 'logo':
      return { maxDimension: 800, quality: 0.85 }
    case 'cover':
      return { maxDimension: 1920, quality: 0.8 }
    default:
      return { maxDimension: 1600, quality: 0.82 }
  }
}
