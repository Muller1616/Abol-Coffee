import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertTriangle, MapPinned, Save, Store } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
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
  type Restaurant,
} from '@/features/restaurant/api'
import { OpeningHoursEditor } from '@/features/restaurant/OpeningHoursEditor'
import { restaurantFormSchema, parseCoord, type RestaurantFormValues } from '@/features/restaurant/schema'
import { createDefaultOpeningHours } from '@/features/restaurant/types'
import { DocumentTitle } from '@/components/DocumentTitle'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'
import { getApiErrorMessage } from '@/lib/api'
import { createFormInvalidHandler, handleFormMutationError } from '@/lib/form'
import { resolveMediaUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

const LocationMapPicker = lazy(async () => {
  const mod = await import('@/features/restaurant/map/LocationMapPicker')
  return { default: mod.LocationMapPicker }
})

function emptyToNull(value?: string) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length === 0 ? null : trimmed
}

function toFormValues(restaurant: Restaurant): RestaurantFormValues {
  return {
    name: restaurant.name,
    description: restaurant.description ?? '',
    address: restaurant.address ?? '',
    city: restaurant.city ?? '',
    state: restaurant.state ?? '',
    country: restaurant.country ?? '',
    postalCode: restaurant.postalCode ?? '',
    latitude: restaurant.latitude == null ? '' : String(restaurant.latitude),
    longitude: restaurant.longitude == null ? '' : String(restaurant.longitude),
    phone: restaurant.phone ?? '',
    email: restaurant.email ?? '',
    facebook: restaurant.facebook ?? '',
    instagram: restaurant.instagram ?? '',
    telegram: restaurant.telegram ?? '',
    openingHours: restaurant.openingHours ?? createDefaultOpeningHours(),
  }
}

export function RestaurantPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [removeCover, setRemoveCover] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'ACTIVE' | 'MAINTENANCE' | null>(null)
  const [logoUploadProgress, setLogoUploadProgress] = useState<number | null>(null)
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null)
  const [mapPickerOpen, setMapPickerOpen] = useState(false)

  const restaurantQuery = useQuery({
    queryKey: ['admin', 'restaurant'],
    queryFn: fetchRestaurant,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
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
      city: '',
      state: '',
      country: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      phone: '',
      email: '',
      facebook: '',
      instagram: '',
      telegram: '',
      openingHours: createDefaultOpeningHours(),
    },
  })

  const descriptionValue = useWatch({ control, name: 'description' }) ?? ''
  const latitudeValue = useWatch({ control, name: 'latitude' }) ?? ''
  const longitudeValue = useWatch({ control, name: 'longitude' }) ?? ''
  const addressValue = useWatch({ control, name: 'address' }) ?? ''
  const cityValue = useWatch({ control, name: 'city' }) ?? ''
  const stateValue = useWatch({ control, name: 'state' }) ?? ''
  const countryValue = useWatch({ control, name: 'country' }) ?? ''
  const postalCodeValue = useWatch({ control, name: 'postalCode' }) ?? ''
  const parsedLat = parseCoord(latitudeValue)
  const parsedLng = parseCoord(longitudeValue)
  useEffect(() => {
    if (!restaurantQuery.data) return

    reset(toFormValues(restaurantQuery.data))
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'activities'] }),
      queryClient.invalidateQueries({ queryKey: ['public', 'menu'] }),
    ])
  }

  const saveMutation = useMutation({
    mutationFn: async (values: RestaurantFormValues) => {
      let restaurant = await updateRestaurant({
        name: values.name,
        description: values.description.trim(),
        address: values.address.trim(),
        city: emptyToNull(values.city),
        state: emptyToNull(values.state),
        country: emptyToNull(values.country),
        postalCode: emptyToNull(values.postalCode),
        latitude: parseCoord(values.latitude),
        longitude: parseCoord(values.longitude),
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
        setLogoUploadProgress(0)
        restaurant = await uploadRestaurantLogo(logoFile, setLogoUploadProgress)
      }

      if (removeCover && restaurant.coverImage) {
        restaurant = await removeRestaurantCover()
      }
      if (coverFile) {
        setCoverUploadProgress(0)
        restaurant = await uploadRestaurantCover(coverFile, setCoverUploadProgress)
      }

      return restaurant
    },
    onSuccess: async (restaurant) => {
      queryClient.setQueryData(['admin', 'restaurant'], restaurant)
      await invalidate()
      reset(toFormValues(restaurant))
      setLogoFile(null)
      setCoverFile(null)
      setRemoveLogo(false)
      setRemoveCover(false)
      pushToast(
        restaurant.latitude != null && restaurant.longitude != null
          ? 'Restaurant location updated successfully'
          : 'Restaurant information updated successfully',
      )
    },
    onSettled: () => {
      setLogoUploadProgress(null)
      setCoverUploadProgress(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: updateRestaurantStatus,
    onSuccess: async (restaurant) => {
      queryClient.setQueryData(['admin', 'restaurant'], restaurant)
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
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Restaurant profile
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Manage your public restaurant profile, media, location, opening hours, and menu status.
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
              hint="Square-friendly logo. Compressed on your device before upload."
              currentImageUrl={logoPreview}
              file={logoFile}
              disabled={pending}
              compressVariant="logo"
              uploadProgress={logoUploadProgress}
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
              hint="Wide hero banner. Compressed on your device before upload."
              currentImageUrl={coverPreview}
              file={coverFile}
              disabled={pending}
              compressVariant="cover"
              uploadProgress={coverUploadProgress}
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
          </div>
        </section>

        <section className="rounded-[28px] border border-border/80 bg-white/90 p-5 shadow-[0_10px_40px_rgb(15_23_42/0.04)] sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPinned className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Restaurant location</h2>
                <p className="text-sm text-muted-foreground">
                  Help guests find you after scanning your QR code. Pick on the map or enter
                  coordinates manually.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full shrink-0 sm:w-auto"
              disabled={pending}
              onClick={() => setMapPickerOpen(true)}
            >
              <MapPinned className="h-4 w-4" />
              Pick on Map
            </Button>
          </div>

          <div className="grid gap-4">
            <FloatingInput
              label="Restaurant address"
              disabled={pending}
              aria-invalid={Boolean(errors.address)}
              error={errors.address?.message}
              hint="Street address guests will see and copy."
              {...register('address')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="City"
                disabled={pending}
                aria-invalid={Boolean(errors.city)}
                error={errors.city?.message}
                {...register('city')}
              />
              <FloatingInput
                label="State / Region"
                disabled={pending}
                aria-invalid={Boolean(errors.state)}
                error={errors.state?.message}
                {...register('state')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Country"
                disabled={pending}
                aria-invalid={Boolean(errors.country)}
                error={errors.country?.message}
                {...register('country')}
              />
              <FloatingInput
                label="Postal code"
                disabled={pending}
                aria-invalid={Boolean(errors.postalCode)}
                error={errors.postalCode?.message}
                hint="Optional"
                {...register('postalCode')}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                label="Latitude"
                inputMode="decimal"
                disabled={pending}
                aria-invalid={Boolean(errors.latitude)}
                error={errors.latitude?.message}
                hint="Between -90 and 90"
                {...register('latitude')}
              />
              <FloatingInput
                label="Longitude"
                inputMode="decimal"
                disabled={pending}
                aria-invalid={Boolean(errors.longitude)}
                error={errors.longitude?.message}
                hint="Between -180 and 180"
                {...register('longitude')}
              />
            </div>
            {parsedLat != null && parsedLng != null ? (
              <p className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
                Map pin set at{' '}
                <span className="font-semibold tabular-nums">
                  {parsedLat.toFixed(5)}, {parsedLng.toFixed(5)}
                </span>
                . Guests will see this on the public menu.
              </p>
            ) : (
              <p className="rounded-2xl border border-border/70 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                No coordinates yet. Use{' '}
                <strong className="font-semibold text-foreground">Pick on Map</strong> (recommended)
                or enter latitude and longitude manually.
              </p>
            )}
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

        <div className="sticky bottom-3 z-10 -mx-1 flex flex-col gap-2 rounded-2xl border border-border/70 bg-white/95 p-2 shadow-[0_12px_40px_rgb(15_23_42/0.12)] backdrop-blur sm:bottom-4 sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
          {formDirty ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              disabled={pending}
              onClick={() => {
                if (!restaurantQuery.data) return
                reset(toFormValues(restaurantQuery.data))
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
            className="h-11 w-full shadow-[0_16px_40px_rgb(16_185_129/0.28)] sm:min-w-48 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </form>

      {mapPickerOpen ? (
        <Suspense fallback={null}>
          <LocationMapPicker
            open={mapPickerOpen}
            onOpenChange={setMapPickerOpen}
            initial={{
              latitude: parsedLat ?? undefined,
              longitude: parsedLng ?? undefined,
              address: addressValue,
              city: cityValue,
              state: stateValue,
              country: countryValue,
              postalCode: postalCodeValue,
            }}
            onConfirm={(result) => {
              setValue('latitude', String(result.latitude), {
                shouldDirty: true,
                shouldValidate: true,
              })
              setValue('longitude', String(result.longitude), {
                shouldDirty: true,
                shouldValidate: true,
              })
              if (result.address) {
                setValue('address', result.address, { shouldDirty: true, shouldValidate: true })
              }
              if (result.city) setValue('city', result.city, { shouldDirty: true })
              if (result.state) setValue('state', result.state, { shouldDirty: true })
              if (result.country) setValue('country', result.country, { shouldDirty: true })
              if (result.postalCode) {
                setValue('postalCode', result.postalCode, { shouldDirty: true })
              }
              pushToast('Restaurant location selected — save changes to publish', 'info')
            }}
          />
        </Suspense>
      ) : null}

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
