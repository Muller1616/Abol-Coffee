import { z } from 'zod'

export const menuItemFormSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().trim().min(1, 'Item name is required').max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.coerce
    .number({ error: 'Price is required' })
    .positive('Price must be greater than 0')
    .max(1_000_000),
  isAvailable: z.boolean(),
})

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>
