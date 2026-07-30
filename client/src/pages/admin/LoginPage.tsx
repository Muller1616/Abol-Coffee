import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coffee,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { DocumentTitle } from '@/components/DocumentTitle'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormErrorSummary } from '@/components/ui/form-error-summary'
import { FloatingInput } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import {
  forgotPasswordRequest,
  resetPasswordRequest,
  verifyOtpRequest,
} from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import { PasswordStrength } from '@/features/auth/PasswordStrength'
import {
  clearRecoveryState,
  formatCountdown,
  loadRecoveryState,
  saveRecoveryState,
  secondsUntil,
  type RecoveryStep,
} from '@/features/auth/recovery-session'
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  validateLoginFields,
  verifyOtpSchema,
  type ForgotPasswordFormValues,
  type LoginFormValues,
  type ResetPasswordFormValues,
  type VerifyOtpFormValues,
} from '@/features/auth/schema'
import { consumeSessionMessage } from '@/features/auth/session/session-message'
import {
  VALIDATION_TOAST,
  createFormInvalidHandler,
  focusFirstInvalidField,
  handleFormMutationError,
} from '@/lib/form'
import { cn } from '@/lib/utils'

const highlights = [
  {
    title: 'Realtime menu control',
    description: 'Update prices and availability instantly for every QR scan.',
  },
  {
    title: 'Permanent QR codes',
    description: 'Print once. Your menu stays fresh without reprinting.',
  },
  {
    title: 'Premium guest experience',
    description: 'A polished digital menu that feels as refined as your café.',
  },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { login, isLoggingIn, loginError, clearLoginError } = useAuth()

  const [isFlipped, setIsFlipped] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loginAttempted, setLoginAttempted] = useState(false)

  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>('request')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(0)
  const [resendSeconds, setResendSeconds] = useState(0)

  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  useEffect(() => {
    const message = consumeSessionMessage()
    if (message) pushToast(message, 'warning')
  }, [pushToast])

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    criteriaMode: 'all',
    defaultValues: { email: '', password: '', rememberMe: false },
  })
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    setError: setLoginFieldError,
    clearErrors: clearLoginErrors,
    getValues: getLoginValues,
    setValue: setLoginValue,
    formState: { errors: loginErrors, submitCount: loginSubmitCount },
  } = loginForm

  const forgotForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: { email: '' },
  })
  const {
    register: registerForgot,
    handleSubmit: handleForgotSubmit,
    setError: setForgotError,
    clearErrors: clearForgotErrors,
    reset: resetForgotForm,
    formState: { errors: forgotErrors, submitCount: forgotSubmitCount },
  } = forgotForm

  const verifyForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: { email: '', otpCode: '' },
  })
  const {
    register: registerVerify,
    handleSubmit: handleVerifySubmit,
    setError: setVerifyError,
    clearErrors: clearVerifyErrors,
    setValue: setVerifyValue,
    reset: resetVerifyForm,
    formState: { errors: verifyErrors, submitCount: verifySubmitCount },
  } = verifyForm

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: { resetToken: '', newPassword: '', confirmPassword: '' },
  })
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    setError: setResetError,
    clearErrors: clearResetErrors,
    setValue: setResetValue,
    reset: resetPasswordForm,
    control: resetControl,
    formState: { errors: resetErrors, submitCount: resetSubmitCount },
  } = resetForm

  const resetNewPassword = useWatch({ control: resetControl, name: 'newPassword' }) ?? ''

  // Restore recovery progress after refresh (countdown from server timestamps).
  useEffect(() => {
    const saved = loadRecoveryState()
    if (!saved) return
    setIsFlipped(true)
    setRecoveryStep(saved.step)
    setRecoveryEmail(saved.email)
    setOtpExpiresAt(saved.expiresAt)
    setResendAvailableAt(saved.resendAvailableAt)
    setResetToken(saved.resetToken)
    resetForgotForm({ email: saved.email })
    resetVerifyForm({ email: saved.email, otpCode: '' })
    if (saved.resetToken) {
      resetPasswordForm({
        resetToken: saved.resetToken,
        newPassword: '',
        confirmPassword: '',
      })
    }
    // Intentionally hydrate once from sessionStorage on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tick = () => {
      setOtpExpirySeconds(secondsUntil(otpExpiresAt))
      setResendSeconds(secondsUntil(resendAvailableAt))
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [otpExpiresAt, resendAvailableAt])

  const emailError =
    typeof loginErrors.email?.message === 'string' ? loginErrors.email.message : undefined
  const passwordError =
    typeof loginErrors.password?.message === 'string' ? loginErrors.password.message : undefined
  const showLoginBanner = Boolean(loginError) && !emailError && !passwordError

  const persistRecovery = (partial: {
    email?: string
    step?: RecoveryStep
    expiresAt?: string | null
    resendAvailableAt?: string | null
    resetToken?: string | null
    resetExpiresAt?: string | null
  }) => {
    const next = {
      email: partial.email ?? recoveryEmail,
      step: partial.step ?? recoveryStep,
      expiresAt: partial.expiresAt === undefined ? otpExpiresAt : partial.expiresAt,
      resendAvailableAt:
        partial.resendAvailableAt === undefined ? resendAvailableAt : partial.resendAvailableAt,
      resetToken: partial.resetToken === undefined ? resetToken : partial.resetToken,
      resetExpiresAt: partial.resetExpiresAt ?? null,
    }
    saveRecoveryState(next)
  }

  const exitRecovery = () => {
    setIsFlipped(false)
    setRecoveryStep('request')
    setOtpError(null)
    setOtpExpiresAt(null)
    setResendAvailableAt(null)
    setResetToken(null)
    clearRecoveryState()
    resetForgotForm({ email: '' })
    resetVerifyForm({ email: '', otpCode: '' })
    resetPasswordForm({ resetToken: '', newPassword: '', confirmPassword: '' })
  }

  const showLoginInvalidFeedback = () => {
    pushToast(VALIDATION_TOAST, 'warning')
    focusFirstInvalidField()
  }

  const submitLogin = handleLoginSubmit(
    async (values) => {
      clearLoginError()
      try {
        const signedIn = await login(values)
        pushToast('Login successful. Redirecting to your dashboard...', 'success')
        navigate(`/${signedIn.restaurantSlug}/dashboard`, { replace: true })
      } catch (error) {
        handleFormMutationError({
          setError: setLoginFieldError,
          error,
          pushToast,
          fallbackMessage: 'Unable to sign in. Please try again later.',
        })
      }
    },
    () => showLoginInvalidFeedback(),
  )

  const onLoginSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setLoginAttempted(true)
    clearLoginError()

    const manual = validateLoginFields(getLoginValues())
    const keys = Object.keys(manual) as Array<'email' | 'password'>
    if (keys.length > 0) {
      keys.forEach((field, index) => {
        const message = manual[field]
        if (!message) return
        setLoginFieldError(field, { type: 'manual', message }, { shouldFocus: index === 0 })
      })
      showLoginInvalidFeedback()
      return
    }

    clearLoginErrors(['email', 'password'])
    void submitLogin(event)
  }

  const applyForgotSuccess = (
    email: string,
    data: { expiresAt: string | null; resendAvailableAt: string | null },
  ) => {
    setRecoveryEmail(email)
    setOtpExpiresAt(data.expiresAt)
    setResendAvailableAt(data.resendAvailableAt)
    setRecoveryStep('verify')
    setVerifyValue('email', email)
    setVerifyValue('otpCode', '')
    persistRecovery({
      email,
      step: 'verify',
      expiresAt: data.expiresAt,
      resendAvailableAt: data.resendAvailableAt,
      resetToken: null,
    })
  }

  const onForgotSubmit = handleForgotSubmit(
    async (values) => {
      setOtpError(null)
      setIsSendingOtp(true)
      try {
        const res = await forgotPasswordRequest(values)
        applyForgotSuccess(values.email.trim().toLowerCase(), res.data)
        pushToast('Verification code sent.', 'success')
      } catch (error) {
        handleFormMutationError({
          setError: setForgotError,
          error,
          pushToast,
          onFormError: setOtpError,
          fallbackMessage: 'Could not send verification code. Please try again.',
        })
      } finally {
        setIsSendingOtp(false)
      }
    },
    createFormInvalidHandler(pushToast),
  )

  const onResendCode = async () => {
    if (resendSeconds > 0 || isSendingOtp || !recoveryEmail) return
    setOtpError(null)
    setIsSendingOtp(true)
    try {
      const res = await forgotPasswordRequest({ email: recoveryEmail })
      applyForgotSuccess(recoveryEmail, res.data)
      pushToast('Verification code sent.', 'success')
    } catch (error) {
      handleFormMutationError({
        setError: setForgotError,
        error,
        pushToast,
        onFormError: setOtpError,
        fallbackMessage: 'Could not resend verification code. Please try again.',
      })
    } finally {
      setIsSendingOtp(false)
    }
  }

  const onVerifySubmit = handleVerifySubmit(
    async (values) => {
      setOtpError(null)
      setIsVerifyingOtp(true)
      try {
        const res = await verifyOtpRequest(values)
        setResetToken(res.data.resetToken)
        setResetValue('resetToken', res.data.resetToken)
        setResetValue('newPassword', '')
        setResetValue('confirmPassword', '')
        setRecoveryStep('reset')
        persistRecovery({
          email: values.email,
          step: 'reset',
          resetToken: res.data.resetToken,
          resetExpiresAt: res.data.expiresAt,
        })
        pushToast('Verification successful.', 'success')
      } catch (error) {
        handleFormMutationError({
          setError: setVerifyError,
          error,
          pushToast,
          onFormError: setOtpError,
          fallbackMessage: 'Invalid verification code.',
        })
      } finally {
        setIsVerifyingOtp(false)
      }
    },
    createFormInvalidHandler(pushToast),
  )

  const onResetSubmit = handleResetSubmit(
    async (values) => {
      setOtpError(null)
      setIsResetting(true)
      try {
        await resetPasswordRequest(values)
        pushToast('Your password has been reset successfully.', 'success')
        setLoginValue('email', recoveryEmail)
        setLoginValue('password', '')
        clearLoginError()
        exitRecovery()
      } catch (error) {
        handleFormMutationError({
          setError: setResetError,
          error,
          pushToast,
          onFormError: setOtpError,
          fallbackMessage: 'Unable to reset password. Please try again.',
        })
      } finally {
        setIsResetting(false)
      }
    },
    createFormInvalidHandler(pushToast),
  )

  const recoveryTitle =
    recoveryStep === 'request'
      ? 'Forgot password'
      : recoveryStep === 'verify'
        ? 'Enter verification code'
        : 'Create a new password'

  const recoveryDescription =
    recoveryStep === 'request'
      ? 'Enter your registered owner email. If an account exists, we will send a 6-digit verification code.'
      : recoveryStep === 'verify'
        ? `Enter the 6-digit code sent to ${recoveryEmail || 'your email'}. The code expires in 3 minutes.`
        : 'Choose a strong password. You will need to sign in again with it.'

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#06120f] text-white">
      <DocumentTitle title="Sign in · Abol Coffee" />

      <div className="absolute top-4 left-4 z-20 sm:top-6 sm:left-6">
        <BackLink tone="dark" label="Back to home" />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(circle at center, black, transparent 78%)',
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden flex-col justify-between px-10 py-12 lg:flex xl:px-16"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
              <Coffee className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Abol Coffee</p>
              <p className="text-sm text-white/55">Digital Menu Control Center</p>
            </div>
          </div>

          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.65 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Premium café operations
              </div>
              <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-white xl:text-6xl">
                Command your menu with quiet confidence.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60">
                A refined admin experience for modern restaurants—built for speed, clarity, and a
                guest-facing menu that always stays current.
              </p>
            </motion.div>

            <div className="mt-10 space-y-4">
              {highlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.08, duration: 0.5 }}
                  className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-white/45">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Secured with JWT sessions, CSRF protection, and encrypted credentials.
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-10"
        >
          <div className="w-full max-w-md perspective-[1000px]">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Coffee className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-base font-semibold">Abol Coffee</p>
                <p className="text-sm text-white/55">Owner access</p>
              </div>
            </div>

            <div
              className={`relative w-full transition-transform duration-700 transform-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* LOGIN */}
              <div
                className={cn(
                  'w-full backface-hidden overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-px shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl',
                  isFlipped ? 'absolute inset-x-0 top-0' : 'relative',
                )}
              >
                <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent" />
                <div className="rounded-[27px] bg-linear-to-b from-white to-[#f7faf9] p-7 text-foreground sm:p-8">
                  <div className="mb-8">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Sign in to manage categories, menu items, pricing, and your permanent QR menu.
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={onLoginSubmit} noValidate>
                    <FormErrorSummary
                      errors={loginErrors}
                      submitCount={loginAttempted ? Math.max(loginSubmitCount, 1) : 0}
                      message="Please complete the required fields before continuing."
                    />
                    <AnimatePresence mode="wait">
                      {showLoginBanner ? (
                        <motion.div
                          key={loginError}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                        >
                          <Alert icon={AlertTriangle} title="Unable to sign in">
                            {loginError}
                          </Alert>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <FloatingInput
                      label="Email address"
                      type="email"
                      autoComplete="email"
                      error={emailError}
                      {...registerLogin('email', {
                        onChange: () => {
                          if (loginErrors.email) clearLoginErrors('email')
                          if (loginError) clearLoginError()
                        },
                      })}
                    />

                    <FloatingInput
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      error={passwordError}
                      trailing={
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                      {...registerLogin('password', {
                        onChange: () => {
                          if (loginErrors.password) clearLoginErrors('password')
                          if (loginError) clearLoginError()
                        },
                      })}
                    />

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Checkbox label="Remember me" {...registerLogin('rememberMe')} />
                      <button
                        type="button"
                        onClick={() => {
                          setIsFlipped(true)
                          clearLoginError()
                          setOtpError(null)
                          setRecoveryStep('request')
                        }}
                        className="cursor-pointer text-xs font-bold text-primary hover:underline focus:outline-hidden"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      loading={isLoggingIn}
                      disabled={isLoggingIn}
                      className="h-14 w-full font-bold"
                    >
                      {isLoggingIn ? 'Signing In...' : 'Continue to dashboard'}
                      {!isLoggingIn ? <ArrowRight className="h-4 w-4" /> : null}
                    </Button>
                  </form>

                  <div className="mt-8 rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Access is limited to the restaurant owner account. Password recovery uses a
                      one-time email verification code.
                    </p>
                  </div>
                </div>
              </div>

              {/* RECOVERY */}
              <div
                className={cn(
                  'w-full backface-hidden rotate-y-180 overflow-hidden rounded-[28px] border border-amber-400/30 bg-white/6 p-px shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl',
                  isFlipped ? 'relative' : 'absolute top-0 left-0',
                )}
              >
                <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent" />
                <div className="rounded-[27px] bg-linear-to-b from-white via-amber-50/30 to-white p-7 text-foreground sm:p-8">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={exitRecovery}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-1 text-xs font-bold text-slate-700 transition hover:text-primary"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Sign In
                    </button>
                    <span className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                      Secure recovery
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/30">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                      {recoveryTitle}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{recoveryDescription}</p>
                  </div>

                  <AnimatePresence mode="wait">
                    {otpError ? (
                      <motion.div
                        key={otpError}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mb-4"
                      >
                        <Alert icon={AlertTriangle} title="Unable to continue">
                          {otpError}
                        </Alert>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {recoveryStep === 'request' ? (
                    <form onSubmit={onForgotSubmit} className="space-y-4" noValidate>
                      <FormErrorSummary errors={forgotErrors} submitCount={forgotSubmitCount} />
                      <FloatingInput
                        label="Owner Email Address"
                        type="email"
                        autoComplete="email"
                        error={
                          typeof forgotErrors.email?.message === 'string'
                            ? forgotErrors.email.message
                            : undefined
                        }
                        {...registerForgot('email', {
                          onChange: () => {
                            if (forgotErrors.email) clearForgotErrors('email')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />
                      <Button
                        type="submit"
                        loading={isSendingOtp}
                        disabled={isSendingOtp}
                        className="h-13 w-full bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-105"
                      >
                        <Send className="h-4 w-4" />
                        {isSendingOtp ? 'Sending code...' : 'Send verification code'}
                      </Button>
                      <p className="text-[11px] leading-relaxed text-slate-500">
                        If an account exists with this email, a verification code has been sent.
                      </p>
                    </form>
                  ) : null}

                  {recoveryStep === 'verify' ? (
                    <form onSubmit={onVerifySubmit} className="space-y-4" noValidate>
                      <FormErrorSummary errors={verifyErrors} submitCount={verifySubmitCount} />

                      <div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-50/80 px-3 py-2.5 text-xs text-emerald-950">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Code expires in
                        </span>
                        <span className="font-mono text-sm font-bold tabular-nums">
                          {formatCountdown(otpExpirySeconds)}
                        </span>
                      </div>

                      <input type="hidden" {...registerVerify('email')} />

                      <FloatingInput
                        label="6-Digit OTP Code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        error={
                          typeof verifyErrors.otpCode?.message === 'string'
                            ? verifyErrors.otpCode.message
                            : undefined
                        }
                        {...registerVerify('otpCode', {
                          onChange: () => {
                            if (verifyErrors.otpCode) clearVerifyErrors('otpCode')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <Button
                        type="submit"
                        loading={isVerifyingOtp}
                        disabled={isVerifyingOtp || otpExpirySeconds === 0}
                        className="h-12 w-full bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-105"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify code'}
                      </Button>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setRecoveryStep('request')
                            persistRecovery({ step: 'request' })
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-primary"
                        >
                          Change email
                        </button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resendSeconds > 0 || isSendingOtp}
                          loading={isSendingOtp}
                          onClick={() => void onResendCode()}
                          className="w-full border-amber-200 bg-white sm:w-auto"
                        >
                          {resendSeconds > 0
                            ? `Resend available in ${resendSeconds}s`
                            : 'Resend code'}
                        </Button>
                      </div>
                    </form>
                  ) : null}

                  {recoveryStep === 'reset' ? (
                    <form onSubmit={onResetSubmit} className="space-y-4" noValidate>
                      <FormErrorSummary errors={resetErrors} submitCount={resetSubmitCount} />
                      <input type="hidden" {...registerReset('resetToken')} />

                      <div className="space-y-2">
                        <FloatingInput
                          label="New Password"
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          error={
                            typeof resetErrors.newPassword?.message === 'string'
                              ? resetErrors.newPassword.message
                              : undefined
                          }
                          trailing={
                            <button
                              type="button"
                              onClick={() => setShowNewPassword((current) => !current)}
                              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          }
                          {...registerReset('newPassword', {
                            onChange: () => {
                              if (resetErrors.newPassword) clearResetErrors('newPassword')
                              if (otpError) setOtpError(null)
                            },
                          })}
                        />
                        <PasswordStrength password={resetNewPassword} />
                      </div>

                      <FloatingInput
                        label="Confirm New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        error={
                          typeof resetErrors.confirmPassword?.message === 'string'
                            ? resetErrors.confirmPassword.message
                            : undefined
                        }
                        {...registerReset('confirmPassword', {
                          onChange: () => {
                            if (resetErrors.confirmPassword) clearResetErrors('confirmPassword')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <Button
                        type="submit"
                        loading={isResetting}
                        disabled={isResetting}
                        className="h-12 w-full bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-105"
                      >
                        {isResetting ? 'Updating password...' : 'Reset password'}
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
