import { z } from 'zod'

/** Shared category name rules for create/edit forms. */
export const categoryNameSchema = z
  .string({ error: 'Category name is required.' })
  .trim()
  .min(1, 'Category name is required.')
  .min(2, 'Category name must be at least 2 characters.')
  .max(80, 'Category name is too long. Keep it under 80 characters.')

export const categoryFormSchema = z.object({
  name: categoryNameSchema,
  isActive: z.boolean(),
})

export type CategoryFormValues = z.output<typeof categoryFormSchema>
export type CategoryFormInput = z.input<typeof categoryFormSchema>
