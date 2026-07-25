import { z } from 'zod';
import { RestaurantStatus } from '../generated/prisma/client.js';
import { openingHoursSchema } from './openingHours.validators.js';

const optionalText = z.string().trim().max(500).nullish();
const optionalLongText = z.string().trim().max(2000).nullish();

const optionalEmail = z.preprocess(
  (value) => (value === '' ? null : value),
  z.email('A valid email is required').nullish(),
);

const optionalUrl = z.preprocess(
  (value) => (value === '' ? null : value),
  z.url('A valid URL is required').nullish(),
);

export const updateRestaurantSchema = z
  .object({
    name: z.string().trim().min(1, 'Restaurant name is required').max(120).optional(),
    logo: optionalText,
    coverImage: optionalText,
    address: optionalText,
    phone: z.string().trim().max(40).nullish(),
    email: optionalEmail,
    description: optionalLongText,
    facebook: optionalUrl,
    instagram: optionalUrl,
    telegram: optionalUrl,
    openingHours: openingHoursSchema.optional(),
    status: z.enum([RestaurantStatus.ACTIVE, RestaurantStatus.MAINTENANCE]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateRestaurantStatusSchema = z.object({
  status: z.enum([RestaurantStatus.ACTIVE, RestaurantStatus.MAINTENANCE]),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateRestaurantStatusInput = z.infer<typeof updateRestaurantStatusSchema>;
