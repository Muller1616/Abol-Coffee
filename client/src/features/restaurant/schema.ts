import { z } from 'zod'
import { WEEKDAYS } from '@/features/restaurant/types'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const dayHoursSchema = z
  .object({
    isClosed: z.boolean(),
    open: z.string().regex(timeRegex, 'Use HH:mm format (e.g. 09:00).').nullable(),
    close: z.string().regex(timeRegex, 'Use HH:mm format (e.g. 17:00).').nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) {
      if (day.open !== null || day.close !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Closed days must not include open or close times.',
        })
      }
      return
    }

    if (!day.open || !day.close) {
      ctx.addIssue({
        code: 'custom',
        message: 'Open days require both open and close times.',
      })
      return
    }

    if (day.open >= day.close) {
      ctx.addIssue({
        code: 'custom',
        message: 'Open time must be earlier than close time.',
      })
    }
  })

export const openingHoursSchema = z.object(
  Object.fromEntries(WEEKDAYS.map((day) => [day, dayHoursSchema])) as Record<
    (typeof WEEKDAYS)[number],
    typeof dayHoursSchema
  >,
)

const phoneRegex = /^[+]?[\d\s().-]{7,40}$/

const coordString = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === '' || !Number.isNaN(Number(value)), {
      message: `${label} must be a valid number.`,
    })
    .refine((value) => {
      if (value === '') return true
      const n = Number(value)
      return n >= min && n <= max
    }, {
      message: `${label} must be between ${min} and ${max}.`,
    })

export const restaurantFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Restaurant name is required.')
      .max(120, 'Restaurant name must be at most 120 characters.'),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required.')
      .max(2000, 'Description must be at most 2000 characters.'),
    address: z
      .string()
      .trim()
      .min(1, 'Address is required.')
      .max(500, 'Address must be at most 500 characters.'),
    city: z.string().trim().max(120, 'City must be at most 120 characters.').optional(),
    state: z.string().trim().max(120, 'State/region must be at most 120 characters.').optional(),
    country: z.string().trim().max(120, 'Country must be at most 120 characters.').optional(),
    postalCode: z
      .string()
      .trim()
      .max(32, 'Postal code must be at most 32 characters.')
      .optional(),
    latitude: coordString(-90, 90, 'Latitude'),
    longitude: coordString(-180, 180, 'Longitude'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required.')
      .regex(phoneRegex, 'Please enter a valid phone number.'),
    email: z.union([z.literal(''), z.email('Please enter a valid email address.')]).optional(),
    facebook: z.union([z.literal(''), z.url('Please enter a valid Facebook URL.')]).optional(),
    instagram: z.union([z.literal(''), z.url('Please enter a valid Instagram URL.')]).optional(),
    telegram: z.union([z.literal(''), z.url('Please enter a valid Telegram URL.')]).optional(),
    openingHours: openingHoursSchema,
  })
  .superRefine((data, ctx) => {
    const hasLat = data.latitude.trim() !== ''
    const hasLng = data.longitude.trim() !== ''
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: 'custom',
        message: 'Both latitude and longitude are required together.',
        path: hasLat ? ['longitude'] : ['latitude'],
      })
    }
  })

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>

export function parseCoord(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}
