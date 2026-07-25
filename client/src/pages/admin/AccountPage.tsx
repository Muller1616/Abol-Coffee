import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { DocumentTitle } from '@/components/DocumentTitle'
import { Alert } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { FloatingInput } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { changePasswordRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schema'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

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

  useEffect(() => {
    if (!isDirty) return

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

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
      const message = getApiErrorMessage(error, 'Could not update password')
      setFormError(message)
      pushToast(message, 'error')
    },
  })

  const pending = mutation.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DocumentTitle title="Account · Abol Coffee" />

      <div>
        <p className="text-sm font-medium text-primary">Security</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Account
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Owner sign-in is limited to a permanent email and password. Business branding, contact
          details, and hours are managed under Restaurant settings.
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
            <p className="text-sm text-muted-foreground">
              Seeded permanently. Email cannot be changed in the application.
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
        transition={{ delay: 0.04 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Restaurant profile</h2>
              <p className="text-sm text-muted-foreground">
                Name, logo, cover, phone, address, hours, and social links.
              </p>
            </div>
          </div>
          <Link
            to="/admin/restaurant"
            className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}
          >
            Open restaurant settings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Change password</h2>
            <p className="text-sm text-muted-foreground">
              Confirm your current password, then choose a new one (8–128 characters).
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
            disabled={pending}
            error={errors.currentPassword?.message}
            trailing={
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                disabled={pending}
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
            disabled={pending}
            hint="Minimum 8 characters. Must differ from the current password."
            error={errors.newPassword?.message}
            trailing={
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                disabled={pending}
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
            disabled={pending}
            error={errors.confirmPassword?.message}
            trailing={
              <button
                type="button"
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                disabled={pending}
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
              There is no forgot-password flow in v1. After changing your password, your current
              session stays signed in until it expires.
            </p>
          </div>

          <Button
            type="submit"
            loading={pending}
            disabled={!isDirty || pending}
            className="w-full sm:w-auto"
          >
            Update password
          </Button>
        </form>
      </motion.section>
    </div>
  )
}
