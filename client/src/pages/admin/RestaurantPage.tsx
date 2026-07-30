import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, Save, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { FormErrorSummary } from '@/components/ui/form-error-summary'
import { ImageUpload } from '@/components/ui/image-upload'
import { FloatingInput } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { FloatingTextarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import {
  fetchRestaurant,
  removeRestaurantCover,
  removeRestaurantLogo,
  updateRestaurant,
  updateRestaurantStatus,
  uploadRestaurantCover,
  uploadRestaurantLogo,
} from '@/features/restaurant/api'
import { OpeningHoursEditor } from '@/features/restaurant/OpeningHoursEditor'
import { restaurantFormSchema, type RestaurantFormValues } from '@/features/restaurant/schema'
import { createDefaultOpeningHours } from '@/features/restaurant/types'
import { DocumentTitle } from '@/components/DocumentTitle'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { getApiErrorMessage } from '@/lib/api'
import { createFormInvalidHandler, handleFormMutationError } from '@/lib/form'
import { resolveMediaUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length === 0 ? null : trimmed
}

export function RestaurantPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [removeCover, setRemoveCover] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'MAINTENANCE' | null>(null)

  const restaurantQuery = useQuery({
    queryKey: ['admin', 'restaurant'],
    queryFn: fetchRestaurant,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty, submitCount },
  } = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    defaultValues: {
      name: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      facebook: '',
      instagram: '',
      telegram: '',
      openingHours: createDefaultOpeningHours(),
    },
  })

  const descriptionValue = useWatch({ control, name: 'description' }) ?? ''

  useEffect(() => {
    if (!restaurantQuery.data) return

    reset({
      name: restaurantQuery.data.name,
      description: restaurantQuery.data.description ?? '',
      address: restaurantQuery.data.address ?? '',
      phone: restaurantQuery.data.phone ?? '',
      email: restaurantQuery.data.email ?? '',
      facebook: restaurantQuery.data.facebook ?? '',
      instagram: restaurantQuery.data.instagram ?? '',
      telegram: restaurantQuery.data.telegram ?? '',
      openingHours: restaurantQuery.data.openingHours ?? createDefaultOpeningHours(),
    })
    setLogoFile(null)
    setCoverFile(null)
    setRemoveLogo(false)
    setRemoveCover(false)
  }, [restaurantQuery.data, reset])

  const hasPendingMedia = Boolean(logoFile || coverFile || removeLogo || removeCover)
  const formDirty = isDirty || hasPendingMedia
  const unsaved = useUnsavedChanges(formDirty)

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async (values: RestaurantFormValues) => {
      let restaurant = await updateRestaurant({
        name: values.name,
        description: values.description.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
        email: emptyToNull(values.email),
        facebook: emptyToNull(values.facebook),
        instagram: emptyToNull(values.instagram),
        telegram: emptyToNull(values.telegram),
        openingHours: values.openingHours,
      })

      if (removeLogo && restaurant.logo) {
        restaurant = await removeRestaurantLogo()
      }
      if (logoFile) {
        restaurant = await uploadRestaurantLogo(logoFile)
      }

      if (removeCover && restaurant.coverImage) {
        restaurant = await removeRestaurantCover()
      }
      if (coverFile) {
        restaurant = await uploadRestaurantCover(coverFile)
      }

      return restaurant
    },
    onSuccess: async (restaurant) => {
      await invalidate()
      reset({
        name: restaurant.name,
        description: restaurant.description ?? '',
        address: restaurant.address ?? '',
        phone: restaurant.phone ?? '',
        email: restaurant.email ?? '',
        facebook: restaurant.facebook ?? '',
        instagram: restaurant.instagram ?? '',
        telegram: restaurant.telegram ?? '',
        openingHours: restaurant.openingHours ?? createDefaultOpeningHours(),
      })
      setLogoFile(null)
      setCoverFile(null)
      setRemoveLogo(false)
      setRemoveCover(false)
      pushToast('Restaurant information updated successfully')
    },
  })

  const statusMutation = useMutation({
    mutationFn: updateRestaurantStatus,
    onSuccess: async (restaurant) => {
      await invalidate()
      setPendingStatus(null)
      pushToast(
        restaurant.status === 'ACTIVE'
          ? 'Public menu is now live'
          : 'Public menu set to maintenance',
      )
    },
    onError: (error) => {
      setPendingStatus(null)
      pushToast(getApiErrorMessage(error, 'Could not update restaurant status'), 'error')
    },
  })

  if (restaurantQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full max-w-xl" />
        <Skeleton className="mt-6 h-40" />
        <Skeleton className="mt-6 h-96" />
      </div>
    )
  }

  if (restaurantQuery.isError || !restaurantQuery.data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Unable to load restaurant settings"
        description={getApiErrorMessage(restaurantQuery.error, 'Please refresh and try again.')}
        className="min-h-105 bg-white"
      />
    )
  }

  const restaurant = restaurantQuery.data
  const isLive = restaurant.status === 'ACTIVE'
  const pending = saveMutation.isPending

  const logoPreview = !removeLogo && !logoFile ? resolveMediaUrl(restaurant.logo) : null
  const coverPreview = !removeCover && !coverFile ? resolveMediaUrl(restaurant.coverImage) : null

  return (
    <div className="space-y-6">
      <DocumentTitle title="Restaurant · Admin" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Restaurant</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Restaurant profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Manage your public restaurant profile, media, opening hours, and menu status.
          </p>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-[28px] border p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6',
          isLive
            ? 'border-success/20 bg-linear-to-br from-success/5 to-white'
            : 'border-accent/25 bg-linear-to-br from-accent/10 to-white',
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Public menu status</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLive
                ? 'Guests scanning your QR code can browse the latest menu.'
                : 'Guests see a temporary maintenance state instead of the menu.'}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 ring-1 ring-border">
            <span className="text-sm font-medium text-muted-foreground">
              {isLive ? 'Active' : 'Maintenance'}
            </span>
            <Switch
              checked={isLive}
              disabled={statusMutation.isPending}
              onCheckedChange={(checked) => {
                const next = checked ? 'ACTIVE' : 'MAINTENANCE'
                if (next === 'MAINTENANCE') {
                  setPendingStatus('MAINTENANCE')
                  return
                }
                statusMutation.mutate('ACTIVE')
              }}
            />
          </div>
        </div>
      </motion.section>

      <form
        className="mt-6 space-y-6"
        noValidate
        onSubmit={handleSubmit(
          async (values) => {
            try {
              await saveMutation.mutateAsync(values)
            } catch (error) {
              handleFormMutationError({
                setError,
                error,
                pushToast,
                fallbackMessage: 'Unable to save restaurant settings. Please try again.',
              })
            }
          },
          createFormInvalidHandler(pushToast),
        )}
      >
        <FormErrorSummary errors={errors} submitCount={submitCount} />

        <section className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Store className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Brand media</h2>
              <p className="text-sm text-muted-foreground">
                Optional logo and cover for the public menu hero. JPG, PNG, or WebP up to 5 MB.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ImageUpload
              label="Logo"
              hint="Square-friendly logo, up to 5 MB."
              currentImageUrl={logoPreview}
              file={logoFile}
              disabled={pending}
              onFileChange={(file) => {
                setLogoFile(file)
                if (file) setRemoveLogo(false)
              }}
              onRemoveExisting={() => {
                if (restaurant.logo) setRemoveLogo(true)
              }}
            />
            <ImageUpload
              label="Cover image"
              hint="Wide hero banner for the public menu."
              currentImageUrl={coverPreview}
              file={coverFile}
              disabled={pending}
              onFileChange={(file) => {
                setCoverFile(file)
                if (file) setRemoveCover(false)
              }}
              onRemoveExisting={() => {
                if (restaurant.coverImage) setRemoveCover(true)
              }}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Profile details</h2>
            <p className="text-sm text-muted-foreground">
              Core information guests see on your digital menu.
            </p>
          </div>

          <div className="grid gap-4">
            <FloatingInput
              label="Restaurant name"
              disabled={pending}
              aria-invalid={Boolean(errors.name)}
              error={errors.name?.message}
              {...register('name')}
            />
            <FloatingTextarea
              label="Description"
              disabled={pending}
              maxLength={2000}
              showCount
              hint="Tell guests what makes your café special."
              aria-invalid={Boolean(errors.description)}
              error={errors.description?.message}
              {...register('description')}
              value={descriptionValue}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Phone"
                disabled={pending}
                aria-invalid={Boolean(errors.phone)}
                hint="Include country code if possible."
                error={errors.phone?.message}
                {...register('phone')}
              />
              <FloatingInput
                label="Public email"
                type="email"
                disabled={pending}
                aria-invalid={Boolean(errors.email)}
                hint="Optional contact email for guests."
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <FloatingInput
              label="Address"
              disabled={pending}
              aria-invalid={Boolean(errors.address)}
              error={errors.address?.message}
              {...register('address')}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Social links</h2>
            <p className="text-sm text-muted-foreground">
              Optional profile URLs for Facebook, Instagram, and Telegram.
            </p>
          </div>
          <div className="grid gap-4">
            <FloatingInput
              label="Facebook URL"
              disabled={pending}
              aria-invalid={Boolean(errors.facebook)}
              error={errors.facebook?.message}
              {...register('facebook')}
            />
            <FloatingInput
              label="Instagram URL"
              disabled={pending}
              aria-invalid={Boolean(errors.instagram)}
              error={errors.instagram?.message}
              {...register('instagram')}
            />
            <FloatingInput
              label="Telegram URL"
              disabled={pending}
              aria-invalid={Boolean(errors.telegram)}
              error={errors.telegram?.message}
              {...register('telegram')}
            />
          </div>
        </section>

        <section className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold tracking-tight">Opening hours</h2>
            <p className="text-sm text-muted-foreground">
              Required weekly schedule. Closed days must not include open or close times.
            </p>
          </div>
          <OpeningHoursEditor control={control} errors={errors} />
        </section>

        <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-2">
          {formDirty ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                if (!restaurantQuery.data) return
                reset({
                  name: restaurantQuery.data.name,
                  description: restaurantQuery.data.description ?? '',
                  address: restaurantQuery.data.address ?? '',
                  phone: restaurantQuery.data.phone ?? '',
                  email: restaurantQuery.data.email ?? '',
                  facebook: restaurantQuery.data.facebook ?? '',
                  instagram: restaurantQuery.data.instagram ?? '',
                  telegram: restaurantQuery.data.telegram ?? '',
                  openingHours: restaurantQuery.data.openingHours ?? createDefaultOpeningHours(),
                })
                setLogoFile(null)
                setCoverFile(null)
                setRemoveLogo(false)
                setRemoveCover(false)
              }}
            >
              Discard
            </Button>
          ) : null}
          <Button
            type="submit"
            loading={pending}
            disabled={pending}
            className="min-w-48 shadow-[0_16px_40px_rgb(15_118_110/0.28)]"
          >
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={unsaved.dialogOpen}
        onOpenChange={(open) => {
          if (!open) unsaved.cancelLeave()
        }}
        title="You have unsaved changes"
        description="Are you sure you want to leave? Your restaurant edits will be lost."
        confirmLabel="Leave page"
        tone="danger"
        onConfirm={unsaved.confirmLeave}
      />

      <ConfirmDialog
        open={pendingStatus === 'MAINTENANCE'}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null)
        }}
        title="Enable maintenance mode?"
        description="Guests scanning your QR code will temporarily see a maintenance message instead of the menu."
        confirmLabel="Set to maintenance"
        tone="danger"
        loading={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate('MAINTENANCE')}
      />
    </div>
  )
}
