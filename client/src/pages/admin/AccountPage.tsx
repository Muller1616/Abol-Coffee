import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { DocumentTitle } from '@/components/DocumentTitle'
import { changePasswordRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schema'
import { getApiErrorMessage } from '@/lib/api'

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
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const mutation = useMutation({
    mutationFn: changePasswordRequest,
    onSuccess: () => {
      reset()
      setFormError(null)
      pushToast('Password updated successfully')
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'Could not update password')
      setFormError(message)
      pushToast(message, 'error')
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DocumentTitle title="Account · Abol Coffee" />

      <div>
        <p className="text-sm font-medium text-primary">Security</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Account
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Your owner email is permanent. Update your password here when needed — there is no
          forgot-password flow in this version.
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Owner email</h2>
            <p className="text-sm text-muted-foreground">Cannot be changed in the application.</p>
          </div>
        </div>

        <FloatingInput label="Email" value={owner?.email ?? ''} readOnly disabled />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Change password</h2>
            <p className="text-sm text-muted-foreground">
              Use at least 8 characters. Keep your session signed in after updating.
            </p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleSubmit(async (values) => {
            setFormError(null)
            await mutation.mutateAsync(values)
          })}
        >
          {formError ? <Alert>{formError}</Alert> : null}

          <FloatingInput
            label="Current password"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            trailing={
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setShowCurrent((value) => !value)}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('currentPassword')}
          />

          <FloatingInput
            label="New password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            hint="Minimum 8 characters"
            error={errors.newPassword?.message}
            trailing={
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setShowNew((value) => !value)}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('newPassword')}
          />

          <FloatingInput
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            trailing={
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setShowConfirm((value) => !value)}
                aria-label={showConfirm ? 'Hide confirmation' : 'Show confirmation'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('confirmPassword')}
          />

          <div className="flex items-start gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              There is no self-serve password recovery. Store your new password securely after
              changing it.
            </p>
          </div>

          <Button
            type="submit"
            loading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
            className="w-full sm:w-auto"
          >
            Update password
          </Button>
        </form>
      </motion.section>
    </div>
  )
}
