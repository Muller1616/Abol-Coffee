import { z } from 'zod'

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(80, 'Keep names under 80 characters'),
  isActive: z.boolean(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
