import { z } from 'zod';

export const menuItemIdParamsSchema = z.object({
  id: z.string().min(1, 'Menu item id is required'),
});

export const listMenuItemsQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  search: z.string().trim().max(120).optional(),
  isAvailable: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === 'true';
    }),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().trim().min(1, 'Item name is required').max(120),
  description: z.string().trim().max(2000).optional().default(''),
  price: z.number().positive('Price must be greater than zero').max(1_000_000),
  image: z.string().trim().max(500).nullable().optional(),
  isAvailable: z.boolean().optional().default(true),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export const updateMenuItemSchema = z
  .object({
    categoryId: z.string().min(1, 'Category is required').optional(),
    name: z.string().trim().min(1, 'Item name is required').max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    price: z.number().positive('Price must be greater than zero').max(1_000_000).optional(),
    image: z.string().trim().max(500).nullable().optional(),
    isAvailable: z.boolean().optional(),
    displayOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateMenuItemAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const reorderMenuItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        displayOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one menu item is required'),
});

export type ListMenuItemsQuery = z.infer<typeof listMenuItemsQuerySchema>;
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type UpdateMenuItemAvailabilityInput = z.infer<typeof updateMenuItemAvailabilitySchema>;
export type ReorderMenuItemsInput = z.infer<typeof reorderMenuItemsSchema>;
