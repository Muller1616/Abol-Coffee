import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FormErrorSummary } from '@/components/ui/form-error-summary'
import { FloatingInput } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import type { Category } from '@/features/categories/api'
import {
  categoryFormSchema,
  type CategoryFormInput,
  type CategoryFormValues,
} from '@/features/categories/schema'
import {
  VALIDATION_TOAST,
  focusFirstInvalidField,
  handleFormMutationError,
} from '@/lib/form'

type CategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  loading?: boolean
  onSubmit: (values: CategoryFormValues) => Promise<void>
}

function requiredNameMessage(raw: string | undefined): string | null {
  if (raw === undefined || raw.length === 0) {
    return 'Category name is required.'
  }
  if (raw.trim().length === 0) {
    return 'Category name cannot contain only spaces.'
  }
  if (raw.trim().length < 2) {
    return 'Category name must be at least 2 characters.'
  }
  if (raw.trim().length > 80) {
    return 'Category name is too long. Keep it under 80 characters.'
  }
  return null
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
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    criteriaMode: 'all',
    defaultValues: {
      name: '',
      isActive: true,
    },
  })

  const isActive = watch('isActive')
  const nameError =
    typeof errors.name?.message === 'string' ? errors.name.message : undefined

  useEffect(() => {
    if (!open) return
    setAttemptedSubmit(false)
    reset({
      name: category?.name ?? '',
      isActive: category?.isActive ?? true,
    })
  }, [category, open, reset])

  const showInvalidFeedback = () => {
    pushToast(VALIDATION_TOAST, 'warning')
    focusFirstInvalidField()
  }

  const submitForm = handleSubmit(
    async (values) => {
      try {
        await onSubmit(values)
      } catch (error) {
        handleFormMutationError({
          setError,
          error,
          pushToast,
          fallbackMessage: 'Unable to save category. Please try again.',
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
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setAttemptedSubmit(true)

            const manualMessage = requiredNameMessage(getValues('name'))
            if (manualMessage) {
              setError('name', { type: 'manual', message: manualMessage }, { shouldFocus: true })
              showInvalidFeedback()
              return
            }

            clearErrors('name')
            void submitForm(event)
          }}
        >
          <FormErrorSummary
            errors={errors}
            submitCount={attemptedSubmit ? Math.max(submitCount, 1) : 0}
            message="Please correct the highlighted field before continuing."
          />

          <FloatingInput
            label="Category name"
            error={nameError}
            autoFocus
            disabled={loading}
            autoComplete="off"
            {...register('name', {
              onChange: () => {
                if (errors.name) clearErrors('name')
              },
            })}
          />

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-[#f8fafc] px-4 py-3">
            <div>
              <p className="text-sm font-medium">Visible on public menu</p>
              <p className="text-xs text-muted-foreground">
                Inactive categories stay hidden from guests.
              </p>
            </div>
            <Switch
              checked={isActive}
              disabled={loading}
              onCheckedChange={(checked) =>
                setValue('isActive', checked, { shouldDirty: true, shouldValidate: false })
              }
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={loading} className="h-11 w-full sm:w-auto">
              {isEditing ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
