import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState, type DragEvent } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ImageUploadProps = {
  label?: string
  currentImageUrl?: string | null
  file: File | null
  onFileChange: (file: File | null) => void
  onRemoveExisting?: () => void
  disabled?: boolean
  hint?: string
}

const ACCEPTED = 'image/jpeg,image/png,image/webp'

export function ImageUpload({
  label = 'Food image',
  currentImageUrl,
  file,
  onFileChange,
  onRemoveExisting,
  disabled = false,
  hint = 'JPG, PNG, or WebP up to 5 MB. Optional.',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    return currentImageUrl ?? null
  }, [currentImageUrl, file])

  const handleFiles = (files: FileList | null) => {
    const next = files?.[0]
    if (!next) return
    onFileChange(next)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
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
            disabled={disabled}
            onClick={() => {
              const hadPendingFile = Boolean(file)
              onFileChange(null)
              // Discarding a new selection should restore the existing preview,
              // not mark the stored image for deletion.
              if (!hadPendingFile) {
                onRemoveExisting?.()
              }
              if (inputRef.current) inputRef.current.value = ''
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative overflow-hidden rounded-2xl border border-dashed bg-[#f8fafc] transition',
          isDragging ? 'border-primary bg-primary/5' : 'border-border/80',
          disabled && 'opacity-60',
        )}
      >
        {previewUrl ? (
          <div className="relative aspect-[16/10]">
            <img src={previewUrl} alt="Menu item preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold text-foreground shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center px-6 py-10 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold">Drag & drop or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">Optimized automatically to WebP</p>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}
