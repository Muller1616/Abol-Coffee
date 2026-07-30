import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FormErrorSummary } from '@/components/ui/form-error-summary'
import { ImageUpload } from '@/components/ui/image-upload'
import { FloatingInput } from '@/components/ui/input'
import { SelectField } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FloatingTextarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import type { Category } from '@/features/categories/api'
import type { MenuItem } from '@/features/menu-items/api'
import { menuItemFormSchema, type MenuItemFormInput, type MenuItemFormValues } from '@/features/menu-items/schema'
import { resolveMediaUrl } from '@/lib/format'
import { getApiFieldErrors } from '@/lib/api'
import { createFormInvalidHandler, handleFormMutationError } from '@/lib/form'

export type MenuItemFormSubmitPayload = {
  values: MenuItemFormValues
  imageFile: File | null
  removeImage: boolean
}

type MenuItemFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: MenuItem | null
  categories: Category[]
  loading?: boolean
  onSubmit: (payload: MenuItemFormSubmitPayload) => Promise<void>
}

export function MenuItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  loading = false,
  onSubmit,
}: MenuItemFormDialogProps) {
  const isEditing = Boolean(item)
  const { pushToast } = useToast()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, submitCount },
  } = useForm<MenuItemFormInput, unknown, MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      categoryId: '',
      name: '',
      description: '',
      price: undefined,
      isAvailable: true,
    },
  })

  const isAvailable = watch('isAvailable')

  useEffect(() => {
    if (!open) return

    reset({
      categoryId: item?.categoryId ?? categories[0]?.id ?? '',
      name: item?.name ?? '',
      description: item?.description ?? '',
      price: item?.price ?? undefined,
      isAvailable: item?.isAvailable ?? true,
    })
    setImageFile(null)
    setRemoveImage(false)
    setImageError(null)
  }, [categories, item, open, reset])

  const currentImageUrl =
    !removeImage && !imageFile ? resolveMediaUrl(item?.image ?? null) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        title={isEditing ? 'Edit menu item' : 'Create menu item'}
        description="Set pricing, category, availability, and an optional food image."
      >
        <form
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit(
            async (values) => {
              setImageError(null)
              try {
                await onSubmit({ values, imageFile, removeImage })
              } catch (error) {
                const uploadMessage =
                  getApiFieldErrors(error).find((item) => item.path === 'image')?.message ?? null
                setImageError(uploadMessage)
                handleFormMutationError({
                  setError,
                  error,
                  pushToast,
                  fallbackMessage: 'Unable to save menu item. Please try again.',
                })
              }
            },
            createFormInvalidHandler(pushToast),
          )}
        >
          <FormErrorSummary errors={errors} submitCount={submitCount} />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              error={errors.categoryId?.message}
              disabled={loading}
              options={categories.map((category) => ({
                value: category.id,
                label: category.isActive ? category.name : `${category.name} (inactive)`,
              }))}
              {...register('categoryId')}
            />
            <FloatingInput
              label="Price (ETB)"
              type="number"
              step="0.01"
              min="0.01"
              disabled={loading}
              error={errors.price?.message}
              {...register('price')}
            />
          </div>

          <FloatingInput
            label="Item name"
            disabled={loading}
            error={errors.name?.message}
            {...register('name')}
          />

          <FloatingTextarea
            label="Description"
            disabled={loading}
            error={errors.description?.message}
            {...register('description')}
          />

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Available on public menu</p>
              <p className="text-xs text-muted-foreground">Hidden items never appear to guests.</p>
            </div>
            <Switch
              checked={isAvailable}
              disabled={loading}
              onCheckedChange={(checked) => setValue('isAvailable', checked, { shouldDirty: true })}
            />
          </div>

          <ImageUpload
            currentImageUrl={currentImageUrl}
            file={imageFile}
            disabled={loading}
            error={imageError}
            onFileChange={(file) => {
              setImageFile(file)
              setImageError(null)
              if (file) setRemoveImage(false)
            }}
            onRemoveExisting={() => {
              if (item?.image) setRemoveImage(true)
            }}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              {isEditing ? 'Save changes' : 'Create item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
