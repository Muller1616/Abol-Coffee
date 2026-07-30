import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { DocumentTitle } from '@/components/DocumentTitle'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FormErrorSummary } from '@/components/ui/form-error-summary'
import { FloatingInput } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { changePasswordRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import { PasswordStrength } from '@/features/auth/PasswordStrength'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schema'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import {
  VALIDATION_TOAST,
  focusFirstInvalidField,
  handleFormMutationError,
} from '@/lib/form'

type ManualErrors = Partial<
  Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>
>

function validateChangePasswordFields(values: ChangePasswordFormValues): ManualErrors {
  const next: ManualErrors = {}

  if (!values.currentPassword || values.currentPassword.length === 0) {
    next.currentPassword = 'Current password is required.'
  }

  if (!values.newPassword || values.newPassword.length === 0) {
    next.newPassword = 'New password is required.'
  } else if (values.newPassword.length < 8) {
    next.newPassword = 'New password must contain at least 8 characters.'
  } else if (values.newPassword.length > 128) {
    next.newPassword = 'Password must be at most 128 characters.'
  } else if (
    values.currentPassword &&
    values.currentPassword.length > 0 &&
    values.currentPassword === values.newPassword
  ) {
    next.newPassword = 'New password must be different from the current password.'
  }

  if (!values.confirmPassword || values.confirmPassword.length === 0) {
    next.confirmPassword = 'Please confirm your password.'
  } else if (
    values.newPassword &&
    values.newPassword.length > 0 &&
    values.newPassword !== values.confirmPassword
  ) {
    next.confirmPassword = 'Passwords do not match.'
  }

  return next
}

export function AccountPage() {
  const { owner } = useAuth()
  const { pushToast } = useToast()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    getValues,
    formState: { errors, isDirty, submitCount },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    criteriaMode: 'all',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = useWatch({ control, name: 'newPassword' }) ?? ''
  const unsaved = useUnsavedChanges(isDirty)

  const mutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      reset()
      setFormError(null)
      setAttemptedSubmit(false)
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
      pushToast('Password updated successfully')
    },
  })

  const pending = mutation.isPending

  const fieldMessage = (key: keyof ManualErrors) => {
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
        setError(field, { type: 'manual', message }, { shouldFocus: index === 0 })
      },
    )
  }

  const submitForm = handleSubmit(
    async (values) => {
      setFormError(null)
      try {
        await mutation.mutateAsync(values)
      } catch (error) {
        handleFormMutationError({
          setError,
          error,
          pushToast,
          onFormError: setFormError,
          fallbackMessage: 'Unable to update password. Please try again.',
        })
      }
    },
    () => {
      showInvalidFeedback()
    },
  )

  return (
    <div className="space-y-6">
      <DocumentTitle title="Settings · Admin" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Settings</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Manage owner account credentials and update security password.
          </p>
        </div>
      </div>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Owner email</h2>
            <p className="text-sm text-muted-foreground">
              Permanent login identity. Cannot be changed in the application.
            </p>
          </div>
        </div>

        <FloatingInput
          label="Email"
          value={owner?.email ?? ''}
          readOnly
          disabled
          autoComplete="username"
        />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-6 rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Change password</h2>
            <p className="text-sm text-muted-foreground">
              Verify your current password, then choose a stronger replacement (8–128 characters).
            </p>
          </div>
        </div>

        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setAttemptedSubmit(true)
            setFormError(null)

            const values = getValues()
            const manual = validateChangePasswordFields(values)
            if (Object.keys(manual).length > 0) {
              applyManualErrors(manual)
              showInvalidFeedback()
              return
            }

            clearErrors(['currentPassword', 'newPassword', 'confirmPassword'])
            void submitForm(event)
          }}
        >
          <FormErrorSummary
            errors={errors}
            submitCount={attemptedSubmit ? Math.max(submitCount, 1) : 0}
            message="Please correct the highlighted fields before continuing."
          />
          {formError ? <Alert>{formError}</Alert> : null}

          <FloatingInput
            label="Current password"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={pending}
            error={fieldMessage('currentPassword')}
            trailing={
              <button
                type="button"
                className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending}
                onClick={() => setShowCurrent((value) => !value)}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('currentPassword', {
              onChange: () => {
                if (errors.currentPassword) clearErrors('currentPassword')
              },
            })}
          />

          <div className="space-y-2">
            <FloatingInput
              label="New password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={pending}
              hint="Use at least 8 characters. Must differ from your current password."
              error={fieldMessage('newPassword')}
              trailing={
                <button
                  type="button"
                  className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pending}
                  onClick={() => setShowNew((value) => !value)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('newPassword', {
                onChange: () => {
                  if (errors.newPassword) clearErrors('newPassword')
                },
              })}
            />
            <PasswordStrength password={newPassword} />
          </div>

          <FloatingInput
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={pending}
            error={fieldMessage('confirmPassword')}
            trailing={
              <button
                type="button"
                className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pending}
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('confirmPassword', {
              onChange: () => {
                if (errors.confirmPassword) clearErrors('confirmPassword')
              },
            })}
          />

          <div className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p>
              Your session remains active after updating your password. Choose a strong password
              containing a mix of letters, numbers, and symbols.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="submit" loading={pending} disabled={pending} className="h-11 w-full sm:w-auto">
              Update password
            </Button>
            {isDirty ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full sm:w-auto"
                disabled={pending}
                onClick={() => {
                  reset()
                  setFormError(null)
                  setAttemptedSubmit(false)
                }}
              >
                Discard changes
              </Button>
            ) : null}
          </div>
        </form>
      </motion.section>

      <ConfirmDialog
        open={unsaved.dialogOpen}
        onOpenChange={(open) => {
          if (!open) unsaved.cancelLeave()
        }}
        title="Leave without saving?"
        description="You have unsaved password changes on this page."
        warning={
          <>
            <p className="font-semibold">Your password changes will be lost.</p>
            <p className="mt-1">Leave only if you do not want to update your password.</p>
          </>
        }
        confirmLabel="Leave page"
        cancelLabel="Stay on page"
        tone="danger"
        onConfirm={unsaved.confirmLeave}
      />
    </div>
  )
}
