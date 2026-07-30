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
import {
  menuItemFormSchema,
  type MenuItemFormInput,
  type MenuItemFormValues,
} from '@/features/menu-items/schema'
import { getApiFieldErrors } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/format'
import {
  VALIDATION_TOAST,
  focusFirstInvalidField,
  handleFormMutationError,
} from '@/lib/form'

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

type ManualErrors = {
  categoryId?: string
  name?: string
  price?: string
}

function validateMenuItemFields(values: {
  categoryId?: string
  name?: string
  price?: unknown
}): ManualErrors {
  const next: ManualErrors = {}

  if (!values.categoryId || values.categoryId.trim().length === 0) {
    next.categoryId = 'Category is required.'
  }

  const name = values.name
  if (name === undefined || name.length === 0) {
    next.name = 'Menu item name is required.'
  } else if (name.trim().length === 0) {
    next.name = 'Menu item name cannot contain only spaces.'
  } else if (name.trim().length < 2) {
    next.name = 'Menu item name must be at least 2 characters.'
  } else if (name.trim().length > 120) {
    next.name = 'Menu item name is too long. Keep it under 120 characters.'
  }

  const rawPrice = values.price
  if (rawPrice === undefined || rawPrice === null || rawPrice === '') {
    next.price = 'Price is required.'
  } else {
    const numeric = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)
    if (!Number.isFinite(numeric)) {
      next.price = 'Please enter a valid price.'
    } else if (numeric <= 0) {
      next.price = 'Price must be greater than 0.'
    } else if (numeric > 1_000_000) {
      next.price = 'Price is too large.'
    }
  }

  return next
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
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    getValues,
    watch,
    formState: { errors, submitCount },
  } = useForm<MenuItemFormInput, unknown, MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    criteriaMode: 'all',
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

    setAttemptedSubmit(false)
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

  const fieldMessage = (key: 'categoryId' | 'name' | 'price' | 'description') => {
    const message = errors[key]?.message
    return typeof message === 'string' ? message : undefined
  }

  const showInvalidFeedback = () => {
    pushToast(VALIDATION_TOAST, 'warning')
    focusFirstInvalidField()
  }

  const applyManualErrors = (manual: ManualErrors) => {
    ;(Object.entries(manual) as Array<[keyof ManualErrors, string | undefined]>).forEach(
      ([field, message], index) => {
        if (!message) return
        setError(
          field,
          { type: 'manual', message },
          { shouldFocus: index === 0 },
        )
      },
    )
  }

  const submitForm = handleSubmit(
    async (values) => {
      setImageError(null)
      try {
        await onSubmit({ values, imageFile, removeImage })
      } catch (error) {
        const uploadMessage =
          getApiFieldErrors(error).find((entry) => entry.path === 'image')?.message ?? null
        setImageError(uploadMessage)
        handleFormMutationError({
          setError,
          error,
          pushToast,
          fallbackMessage: 'Unable to save menu item. Please try again.',
        })
      }
    },
    () => {
      showInvalidFeedback()
    },
  )

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
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setAttemptedSubmit(true)

            const values = getValues()
            const manual = validateMenuItemFields(values)
            const hasManualErrors = Object.keys(manual).length > 0

            if (hasManualErrors) {
              applyManualErrors(manual)
              showInvalidFeedback()
              return
            }

            clearErrors(['categoryId', 'name', 'price'])
            void submitForm(event)
          }}
        >
          <FormErrorSummary
            errors={errors}
            submitCount={attemptedSubmit ? Math.max(submitCount, 1) : 0}
            message="Please correct the highlighted fields before continuing."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              error={fieldMessage('categoryId')}
              disabled={loading || categories.length === 0}
              options={categories.map((category) => ({
                value: category.id,
                label: category.isActive ? category.name : `${category.name} (inactive)`,
              }))}
              {...register('categoryId', {
                onChange: () => {
                  if (errors.categoryId) clearErrors('categoryId')
                },
              })}
            />
            <FloatingInput
              label="Price (ETB)"
              type="number"
              step="0.01"
              min="0.01"
              disabled={loading}
              error={fieldMessage('price')}
              {...register('price', {
                onChange: () => {
                  if (errors.price) clearErrors('price')
                },
              })}
            />
          </div>

          <FloatingInput
            label="Item name"
            disabled={loading}
            error={fieldMessage('name')}
            autoComplete="off"
            {...register('name', {
              onChange: () => {
                if (errors.name) clearErrors('name')
              },
            })}
          />

          <FloatingTextarea
            label="Description"
            disabled={loading}
            error={fieldMessage('description')}
            {...register('description')}
          />

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Available on public menu</p>
              <p className="text-xs text-muted-foreground">
                Hidden items never appear to guests.
              </p>
            </div>
            <Switch
              checked={isAvailable}
              disabled={loading}
              onCheckedChange={(checked) =>
                setValue('isAvailable', checked, { shouldDirty: true, shouldValidate: false })
              }
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
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
