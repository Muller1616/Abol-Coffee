import { z } from 'zod'

export const menuItemFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required.'),
  name: z
    .string({ error: 'Menu item name is required.' })
    .trim()
    .min(1, 'Menu item name is required.')
    .min(2, 'Menu item name must be at least 2 characters.')
    .max(120, 'Menu item name is too long. Keep it under 120 characters.'),
  description: z.string().trim().max(2000, 'Description is too long.').optional(),
  price: z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) return undefined
      if (typeof value === 'string' && value.trim() === '') return undefined
      const numeric = typeof value === 'number' ? value : Number(value)
      return Number.isFinite(numeric) ? numeric : value
    },
    z
      .number({ error: 'Price is required.' })
      .positive('Price must be greater than 0.')
      .max(1_000_000, 'Price is too large.'),
  ),
  isAvailable: z.boolean(),
})

export type MenuItemFormValues = z.output<typeof menuItemFormSchema>
export type MenuItemFormInput = z.input<typeof menuItemFormSchema>
