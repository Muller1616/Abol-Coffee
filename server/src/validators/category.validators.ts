import { z } from 'zod';

const categoryNameSchema = z
  .string({ message: 'Category name is required.' })
  .trim()
  .min(1, 'Category name is required.')
  .min(2, 'Category name must be at least 2 characters.')
  .max(80, 'Category name is too long. Keep it under 80 characters.');

export const categoryIdParamsSchema = z.object({
  id: z.string().min(1, 'Category id is required'),
});

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z
  .object({
    name: categoryNameSchema.optional(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const updateCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export const reorderCategoriesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        displayOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one category is required'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type UpdateCategoryStatusInput = z.infer<typeof updateCategoryStatusSchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
