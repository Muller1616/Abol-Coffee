import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react'

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string | null | undefined
  /** Rendered when `src` is missing or the image fails to load. */
  fallback?: ReactNode
}

/**
 * Image that never shows a broken-image icon.
 * Falls back when the URL is empty or the browser reports a load error.
 */
export function SafeImage({ src, alt = '', fallback = null, onError, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return <>{fallback}</>
  }

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}
