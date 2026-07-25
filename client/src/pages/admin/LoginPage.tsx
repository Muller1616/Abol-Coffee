import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Coffee, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FloatingInput } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { loginSchema, type LoginFormValues } from '@/features/auth/schema'

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
  const { login, isLoggingIn, loginError, clearLoginError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    clearLoginError()
    await login(values)
    navigate('/admin/dashboard', { replace: true })
  })

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#06120f] text-white">
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
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
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
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Coffee className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-base font-semibold">Abol Coffee</p>
                <p className="text-sm text-white/55">Owner access</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-[1px] shadow-[0_30px_80px_rgb(0_0_0/0.35)] backdrop-blur-2xl">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <div className="rounded-[27px] bg-gradient-to-b from-white to-[#f7faf9] p-7 text-foreground sm:p-8">
                <div className="mb-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <LockKeyhole className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">Welcome back</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Sign in to manage categories, menu items, pricing, and your permanent QR menu.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={onSubmit} noValidate>
                  <AnimatePresence mode="wait">
                    {loginError ? (
                      <motion.div
                        key={loginError}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                      >
                        <Alert>{loginError}</Alert>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <FloatingInput
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    error={errors.email?.message}
                    {...register('email', {
                      onChange: () => {
                        if (loginError) clearLoginError()
                      },
                    })}
                  />

                  <FloatingInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    error={errors.password?.message}
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
                    {...register('password', {
                      onChange: () => {
                        if (loginError) clearLoginError()
                      },
                    })}
                  />

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Checkbox label="Remember me for 30 days" {...register('rememberMe')} />
                  </div>

                  <Button type="submit" loading={isLoggingIn} className="h-14 w-full">
                    Continue to dashboard
                    {!isLoggingIn ? <ArrowRight className="h-4 w-4" /> : null}
                  </Button>
                </form>

                <div className="mt-8 rounded-2xl border border-border/70 bg-[#f8fafc] px-4 py-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Access is limited to the restaurant owner account. Password recovery is handled
                    securely outside the app for Version 1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
