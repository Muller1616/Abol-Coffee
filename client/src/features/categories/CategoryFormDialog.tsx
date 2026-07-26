import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FormErrorSummary } from '@/components/ui/form-error-summary'
import { FloatingInput } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import type { Category } from '@/features/categories/api'
import { categoryFormSchema, type CategoryFormValues } from '@/features/categories/schema'
import { applyServerFieldErrors, createFormInvalidHandler } from '@/lib/form'

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  loading?: boolean
  onSubmit: (values: CategoryFormValues) => Promise<void>
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  loading = false,
  onSubmit,
}: CategoryFormDialogProps) {
  const isEditing = Boolean(category)
  const { pushToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, submitCount },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      isActive: true,
    },
  })

  const isActive = watch('isActive')

  useEffect(() => {
    if (!open) return
    reset({
      name: category?.name ?? '',
      isActive: category?.isActive ?? true,
    })
  }, [category, open, reset])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEditing ? 'Edit category' : 'Create category'}
        description={
          isEditing
            ? 'Update the category name or visibility for your public menu.'
            : 'Add a new section to organize items on your digital menu.'
        }
      >
        <form
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit(
            async (values) => {
              try {
                await onSubmit(values)
              } catch (error) {
                if (applyServerFieldErrors(setError, error)) {
                  pushToast('Please complete all required fields.', 'error')
                }
              }
            },
            createFormInvalidHandler(pushToast),
          )}
        >
          <FormErrorSummary errors={errors} submitCount={submitCount} />

          <FloatingInput
            label="Category name"
            error={errors.name?.message}
            autoFocus
            disabled={loading}
            {...register('name')}
          />

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Visible on public menu</p>
              <p className="text-xs text-muted-foreground">Inactive categories stay hidden from guests.</p>
            </div>
            <Switch
              checked={isActive}
              disabled={loading}
              onCheckedChange={(checked) => setValue('isActive', checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading}>
              {isEditing ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
