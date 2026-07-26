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
  HelpCircle,
  KeyRound,
  LockKeyhole,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { BackLink } from '@/components/BackLink'
import { DocumentTitle } from '@/components/DocumentTitle'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingInput } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { resetWithOtpRequest, sendOtpRequest } from '@/features/auth/api'
import { useAuth } from '@/features/auth/auth-context'
import {
  loginSchema,
  resetWithOtpSchema,
  sendOtpSchema,
  type LoginFormValues,
  type ResetWithOtpFormValues,
  type SendOtpFormValues,
} from '@/features/auth/schema'
import { getApiErrorMessage } from '@/lib/api'
import { applyServerFieldErrors, createFormInvalidHandler } from '@/lib/form'

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

  // OTP Step Flow on Back Face
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request')
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // 1. Login Form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  // 2. Request OTP Form
  const sendOtpForm = useForm<SendOtpFormValues>({
    resolver: zodResolver(sendOtpSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      email: 'owner@abolcoffee.com',
    },
  })

  // 3. Verify OTP & Reset Password Form
  const resetOtpForm = useForm<ResetWithOtpFormValues>({
    resolver: zodResolver(resetWithOtpSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      email: '',
      otpCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Handlers
  const onLoginSubmit = loginForm.handleSubmit(
    async (values) => {
      clearLoginError()
      try {
        await login(values)
        pushToast('Login successful. Redirecting...', 'success')
        navigate('/admin/dashboard', { replace: true })
      } catch (error) {
        applyServerFieldErrors(loginForm.setError, error)
      }
    },
    createFormInvalidHandler(pushToast),
  )

  const onSendOtpSubmit = sendOtpForm.handleSubmit(
    async (values) => {
      setOtpError(null)
      setIsSendingOtp(true)
      try {
        const res = await sendOtpRequest(values)
        const generatedCode = res.data.otpCode
        setActiveOtpCode(generatedCode)

        resetOtpForm.setValue('email', values.email)
        resetOtpForm.setValue('otpCode', generatedCode)
        setOtpStep('verify')

        pushToast('OTP code sent to email!', 'success')
      } catch (error) {
        if (!applyServerFieldErrors(sendOtpForm.setError, error)) {
          setOtpError(getApiErrorMessage(error, 'Could not send verification code.'))
        }
      } finally {
        setIsSendingOtp(false)
      }
    },
    createFormInvalidHandler(pushToast),
  )

  const onResetWithOtpSubmit = resetOtpForm.handleSubmit(
    async (values) => {
      setOtpError(null)
      setIsResetting(true)
      try {
        await resetWithOtpRequest(values)
        pushToast('Password reset successfully! Please log in with your new password.', 'success')

        loginForm.setValue('email', values.email)
        loginForm.setValue('password', '')
        clearLoginError()

        setIsFlipped(false)
        setOtpStep('request')
        setActiveOtpCode(null)
      } catch (error) {
        if (!applyServerFieldErrors(resetOtpForm.setError, error)) {
          setOtpError(getApiErrorMessage(error, 'Failed to reset password. Check OTP and try again.'))
        }
      } finally {
        setIsResetting(false)
      }
    },
    createFormInvalidHandler(pushToast),
  )

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
        {/* Left Hero Column */}
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

        {/* Right Interactive Column - 3D Flipping Card */}
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

            {/* 3D Flip Container */}
            <div
              className={`relative w-full transition-transform duration-700 transform-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* ================= FRONT FACE: LOGIN CARD ================= */}
              <div className="w-full backface-hidden relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-px shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl">
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
                    {/* General / System Level Error Banner ONLY */}
                    <AnimatePresence mode="wait">
                      {loginError ? (
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
                      error={loginForm.formState.errors.email?.message}
                      {...loginForm.register('email', {
                        onChange: () => {
                          if (loginForm.formState.errors.email) loginForm.clearErrors('email')
                          if (loginError) clearLoginError()
                        },
                      })}
                    />

                    <FloatingInput
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      error={loginForm.formState.errors.password?.message}
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
                      {...loginForm.register('password', {
                        onChange: () => {
                          if (loginForm.formState.errors.password) loginForm.clearErrors('password')
                          if (loginError) clearLoginError()
                        },
                      })}
                    />

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <Checkbox label="Remember me" {...loginForm.register('rememberMe')} />
                      <button
                        type="button"
                        onClick={() => {
                          setIsFlipped(true)
                          clearLoginError()
                          setOtpError(null)
                        }}
                        className="text-xs font-bold text-primary hover:underline focus:outline-hidden cursor-pointer"
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
                      Access is limited to the restaurant owner account. Reset password via email OTP on the back card.
                    </p>
                  </div>
                </div>
              </div>

              {/* ================= BACK FACE: FORGOT PASSWORD (OTP) CARD ================= */}
              <div className="w-full backface-hidden rotate-y-180 absolute top-0 left-0 overflow-hidden rounded-[28px] border border-amber-400/30 bg-white/6 p-px shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl">
                <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent" />
                <div className="rounded-[27px] bg-linear-to-b from-white via-amber-50/30 to-white p-7 text-foreground sm:p-8">
                  {/* Top Bar with Flip Back Action */}
                  <div className="mb-6 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFlipped(false)
                        setOtpError(null)
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-primary transition cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Sign In
                    </button>

                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-400/30">
                      OTP Password Recovery
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/30">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-slate-950">
                      {otpStep === 'request' ? 'Request Verification OTP' : 'Enter OTP & New Password'}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {otpStep === 'request'
                        ? 'Enter your registered owner email address to receive a 6-digit OTP verification code.'
                        : 'Check your email inbox for the 6-digit OTP code and choose a new password.'}
                    </p>
                  </div>

                  {/* General / System Level Error Banner ONLY */}
                  <AnimatePresence mode="wait">
                    {otpError ? (
                      <motion.div
                        key={otpError}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mb-4"
                      >
                        <Alert icon={AlertTriangle} title="Verification Failed">
                          {otpError}
                        </Alert>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* STEP 1: Request OTP Form */}
                  {otpStep === 'request' ? (
                    <form onSubmit={onSendOtpSubmit} className="space-y-4" noValidate>
                      <FloatingInput
                        label="Owner Email Address"
                        type="email"
                        autoComplete="email"
                        error={sendOtpForm.formState.errors.email?.message}
                        {...sendOtpForm.register('email', {
                          onChange: () => {
                            if (sendOtpForm.formState.errors.email) sendOtpForm.clearErrors('email')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <Button
                        type="submit"
                        loading={isSendingOtp}
                        disabled={isSendingOtp}
                        className="h-13 w-full font-bold bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-105"
                      >
                        <Send className="h-4 w-4" />
                        {isSendingOtp ? 'Sending OTP Code...' : 'Send Verification OTP'}
                      </Button>
                    </form>
                  ) : (
                    /* STEP 2: Verify OTP & Reset Password Form */
                    <form onSubmit={onResetWithOtpSubmit} className="space-y-4" noValidate>
                      {activeOtpCode ? (
                        <div className="rounded-xl border border-emerald-400/40 bg-emerald-50/80 p-3 text-xs text-emerald-950 flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>OTP Code sent to email!</span>
                          </div>
                          <span className="font-mono font-extrabold text-sm tracking-widest bg-emerald-200/80 px-2 py-0.5 rounded-lg border border-emerald-300">
                            {activeOtpCode}
                          </span>
                        </div>
                      ) : null}

                      <FloatingInput
                        label="Owner Email Address"
                        type="email"
                        error={resetOtpForm.formState.errors.email?.message}
                        {...resetOtpForm.register('email', {
                          onChange: () => {
                            if (resetOtpForm.formState.errors.email) resetOtpForm.clearErrors('email')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <FloatingInput
                        label="6-Digit OTP Code"
                        type="text"
                        maxLength={6}
                        error={resetOtpForm.formState.errors.otpCode?.message}
                        {...resetOtpForm.register('otpCode', {
                          onChange: () => {
                            if (resetOtpForm.formState.errors.otpCode) resetOtpForm.clearErrors('otpCode')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <FloatingInput
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        error={resetOtpForm.formState.errors.newPassword?.message}
                        trailing={
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((current) => !current)}
                            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                        {...resetOtpForm.register('newPassword', {
                          onChange: () => {
                            if (resetOtpForm.formState.errors.newPassword) resetOtpForm.clearErrors('newPassword')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <FloatingInput
                        label="Confirm New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        error={resetOtpForm.formState.errors.confirmPassword?.message}
                        {...resetOtpForm.register('confirmPassword', {
                          onChange: () => {
                            if (resetOtpForm.formState.errors.confirmPassword) resetOtpForm.clearErrors('confirmPassword')
                            if (otpError) setOtpError(null)
                          },
                        })}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOtpStep('request')}
                          className="h-12 px-3 text-xs font-bold text-slate-700 hover:text-primary transition flex items-center justify-center rounded-2xl border border-border/80 bg-white/70"
                        >
                          Resend OTP
                        </button>

                        <Button
                          type="submit"
                          loading={isResetting}
                          disabled={isResetting}
                          className="h-12 flex-1 font-bold bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-105"
                        >
                          {isResetting ? 'Resetting Password...' : 'Verify OTP & Reset Password'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Seed / Default Credentials Quick Action */}
                  <div className="mt-5 rounded-xl border border-amber-200/80 bg-white/90 p-3 text-xs text-slate-700 space-y-1.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      Default Owner Seed Credentials
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Default Email: <code className="rounded bg-amber-100 px-1 py-0.5 font-mono font-bold text-slate-900">owner@abolcoffee.com</code>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        sendOtpForm.setValue('email', 'owner@abolcoffee.com')
                        resetOtpForm.setValue('email', 'owner@abolcoffee.com')
                        resetOtpForm.setValue('newPassword', 'ChangeMe123!')
                        resetOtpForm.setValue('confirmPassword', 'ChangeMe123!')
                        loginForm.setValue('email', 'owner@abolcoffee.com')
                        loginForm.setValue('password', 'ChangeMe123!')
                        setOtpError(null)
                        clearLoginError()
                        pushToast('Default seed credentials filled into form', 'success')
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-500/25 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Fill Default Owner Credentials
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
