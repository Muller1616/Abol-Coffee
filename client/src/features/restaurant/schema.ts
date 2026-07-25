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

export const restaurantFormSchema = z.object({
  name: z.string().trim().min(1, 'Restaurant name is required').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  email: z
    .union([z.literal(''), z.email('Enter a valid email')])
    .optional(),
  facebook: z.union([z.literal(''), z.url('Enter a valid URL')]).optional(),
  instagram: z.union([z.literal(''), z.url('Enter a valid URL')]).optional(),
  telegram: z.union([z.literal(''), z.url('Enter a valid URL')]).optional(),
  openingHours: openingHoursSchema,
})

export type RestaurantFormValues = z.infer<typeof restaurantFormSchema>
