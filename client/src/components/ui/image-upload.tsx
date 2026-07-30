import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FieldError } from '@/components/ui/field-error'
import {
  compressImageFile,
  compressOptionsForVariant,
} from '@/lib/compress-image'
import { cn } from '@/lib/utils'

export const IMAGE_UPLOAD_ACCEPTED = 'image/jpeg,image/png,image/webp'
export const IMAGE_UPLOAD_ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024

export function validateImageFile(file: File): string | null {
  if (!file || file.size === 0) {
    return 'Please select a non-empty image file.'
  }
  if (!IMAGE_UPLOAD_ACCEPTED_TYPES.has(file.type)) {
    return 'Use a JPG, PNG, or WebP image.'
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }
  return null
}

type ImageUploadProps = {
  label?: string
  currentImageUrl?: string | null
  file: File | null
  onFileChange: (file: File | null) => void
  onRemoveExisting?: () => void
  disabled?: boolean
  hint?: string
  /** External / server-side error (e.g. upload API failure). */
  error?: string | null
  /** Confirm before removing a saved image. Defaults to true. */
  confirmRemoveExisting?: boolean
  removeConfirmTitle?: string
  removeConfirmDescription?: string
  /** Compression profile before the file is stored in form state. */
  compressVariant?: 'logo' | 'cover' | 'menuItem'
  /** 0–100 upload progress from the parent mutation (optional). */
  uploadProgress?: number | null
}

export function ImageUpload({
  label = 'Food image',
  currentImageUrl,
  file,
  onFileChange,
  onRemoveExisting,
  disabled = false,
  hint = 'JPG, PNG, or WebP up to 5 MB. Compressed on your device before upload.',
  error = null,
  confirmRemoveExisting = true,
  removeConfirmTitle,
  removeConfirmDescription,
  compressVariant = 'menuItem',
  uploadProgress = null,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  const displayError = error || localError
  const busy = disabled || isCompressing

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return currentImageUrl ?? null
  }, [currentImageUrl, file])

  useEffect(() => {
    if (!file || !previewUrl?.startsWith('blob:')) return
    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [file, previewUrl])

  const resetFileInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const clearPendingSelection = () => {
    onFileChange(null)
    setLocalError(null)
    resetFileInput()
  }

  const removeExistingImage = () => {
    onFileChange(null)
    setLocalError(null)
    onRemoveExisting?.()
    resetFileInput()
    setConfirmOpen(false)
  }

  const handleRemoveClick = () => {
    if (busy) return

    if (file) {
      clearPendingSelection()
      return
    }

    if (!currentImageUrl) return

    if (confirmRemoveExisting) {
      setConfirmOpen(true)
      return
    }

    removeExistingImage()
  }

  const handleFiles = async (files: FileList | null) => {
    const next = files?.[0]
    if (!next) return

    const validationError = validateImageFile(next)
    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)
    setIsCompressing(true)
    try {
      // Show original immediately for perceived speed, then swap to compressed.
      onFileChange(next)
      const compressed = await compressImageFile(
        next,
        compressOptionsForVariant(compressVariant),
      )
      onFileChange(compressed)
    } catch {
      onFileChange(next)
    } finally {
      setIsCompressing(false)
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (busy) return
    void handleFiles(event.dataTransfer.files)
  }

  const showProgress =
    typeof uploadProgress === 'number' && uploadProgress >= 0 && uploadProgress < 100

  return (
    <div className="space-y-3" data-invalid={displayError ? 'true' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        {(file || currentImageUrl) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={handleRemoveClick}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!busy) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        aria-invalid={displayError ? true : undefined}
        aria-describedby={displayError ? errorId : undefined}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-dashed bg-[#f8fafc] transition-all duration-200',
          busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5',
          isDragging ? 'border-2 border-primary bg-primary/10 shadow-lg' : 'border-border/80',
          displayError && 'border-danger/50',
        )}
      >
        {isDragging ? (
          <div className="flex w-full flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md animate-bounce">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-base font-bold text-primary">Drop your image here</p>
            <p className="mt-1 text-xs text-muted-foreground">Release to upload file</p>
          </div>
        ) : previewUrl ? (
          <div
            onClick={() => !busy && inputRef.current?.click()}
            className="group relative aspect-[16/10] cursor-pointer overflow-hidden"
          >
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {(isCompressing || showProgress) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 px-6">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p className="text-xs font-semibold text-white">
                  {isCompressing
                    ? 'Optimizing image…'
                    : `Uploading ${Math.round(uploadProgress ?? 0)}%`}
                </p>
                {showProgress ? (
                  <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full rounded-full bg-white transition-[width] duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, uploadProgress ?? 0))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-xs font-bold text-foreground shadow-md backdrop-blur transform translate-y-1 transition-transform group-hover:translate-y-0">
                Change image
              </span>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              className="absolute right-3 bottom-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-white disabled:cursor-not-allowed"
            >
              <Upload className="h-3.5 w-3.5" />
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center px-6 py-10 text-center transition-colors group disabled:cursor-not-allowed"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
              {isCompressing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </div>
            <p className="text-sm font-semibold transition-colors group-hover:text-primary">
              {isCompressing ? 'Optimizing image…' : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Compressed on device, then saved as WebP
            </p>
          </button>
        )}
      </div>

      <FieldError id={errorId} message={displayError} />

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPTED}
        className="hidden"
        disabled={busy}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={removeConfirmTitle ?? `Remove ${label.toLowerCase()}?`}
        description={
          removeConfirmDescription ??
          'This image will be permanently deleted when you save. Guests will no longer see it on the public menu.'
        }
        warning="This action cannot be undone after you save your changes."
        confirmLabel="Remove image"
        tone="danger"
        onConfirm={removeExistingImage}
      />
    </div>
  )
}
