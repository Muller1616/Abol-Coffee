import { z } from 'zod'
import { WEEKDAYS } from '@/features/restaurant/types'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const dayHoursSchema = z
  .object({
    isClosed: z.boolean(),
    open: z.string().regex(timeRegex, 'Use HH:mm').nullable(),
    close: z.string().regex(timeRegex, 'Use HH:mm').nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) {
      if (day.open !== null || day.close !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Closed days must not include open or close times',
        })
      }
      return
    }

    if (!day.open || !day.close) {
      ctx.addIssue({
        code: 'custom',
        message: 'Open days require both open and close times',
      })
      return
    }

    if (day.open >= day.close) {
      ctx.addIssue({
        code: 'custom',
        message: 'Open time must be earlier than close time',
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

export const restaurantFormSchema = z.object({
  name: z.string().trim().min(1, 'Restaurant name is required').max(120, 'Maximum 120 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Maximum 2000 characters'),
  address: z.string().trim().min(1, 'Address is required').max(500, 'Maximum 500 characters'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Enter a valid phone number'),
  email: z
    .union([z.literal(''), z.email('Enter a valid email')])
    .optional(),
  facebook: z.union([z.literal(''), z.url('Enter a valid URL')]).optional(),
  instagram: z.union([z.literal(''), z.url('Enter a valid URL')]).optional(),
  telegram: z.union([z.literal(''), z.url('Enter a valid URL')]).optional(),
  openingHours: openingHoursSchema,
})

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>
