import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { DocumentTitle } from '@/components/DocumentTitle'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { getApiErrorMessage, getApiValidationDetails } from '@/lib/api'
import { applyServerFieldErrors, createFormInvalidHandler } from '@/lib/form'

export function AccountPage() {
  const { owner } = useAuth()
  const { pushToast } = useToast()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty, submitCount },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
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
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
      pushToast('Password updated successfully')
    },
    onError: (error) => {
      if (getApiValidationDetails(error)) return
      const message = getApiErrorMessage(error, 'Could not update password')
      setFormError(message)
      pushToast(message, 'error')
    },
  })

  const pending = mutation.isPending

  return (
    <div className="space-y-6">
      <DocumentTitle title="Settings · Admin" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Settings</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
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
          onSubmit={handleSubmit(
            async (values) => {
              setFormError(null)
              try {
                await mutation.mutateAsync(values)
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
          {formError ? <Alert>{formError}</Alert> : null}

          <FloatingInput
            label="Current password"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={pending}
            error={errors.currentPassword?.message}
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
            {...register('currentPassword')}
          />

          <div className="space-y-2">
            <FloatingInput
              label="New password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={pending}
              hint="Use at least 8 characters. Must differ from your current password."
              error={errors.newPassword?.message}
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
              {...register('newPassword')}
            />
            <PasswordStrength password={newPassword} />
          </div>

          <FloatingInput
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            disabled={pending}
            error={errors.confirmPassword?.message}
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
            {...register('confirmPassword')}
          />

          <div className="flex items-start gap-3 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p>
              Your session remains active after updating your password. Choose a strong password containing a mix of letters, numbers, and symbols.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" loading={pending} disabled={pending}>
              Update password
            </Button>
            {isDirty ? (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  reset()
                  setFormError(null)
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
        title="You have unsaved changes"
        description="Are you sure you want to leave? Your password changes will be lost."
        confirmLabel="Leave page"
        tone="danger"
        onConfirm={unsaved.confirmLeave}
      />
    </div>
  )
}
