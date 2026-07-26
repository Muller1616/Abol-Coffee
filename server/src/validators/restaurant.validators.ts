import { z } from 'zod';
import { RestaurantStatus } from '../generated/prisma/client.js';
import { openingHoursSchema } from './openingHours.validators.js';

const optionalText = z.string().trim().max(500).nullish();
const phoneRegex = /^[+]?[\d\s().-]{7,40}$/;

const optionalEmail = z.preprocess(
  (value) => (value === '' ? null : value),
  z.email('A valid email is required').nullish(),
);

const optionalUrl = z.preprocess(
  (value) => (value === '' ? null : value),
  z.url('A valid URL is required').nullish(),
);

const requiredPhone = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid phone number')
    .optional(),
);

const requiredDescription = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.string().trim().min(1, 'Description is required').max(2000).optional(),
);

const requiredAddress = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.string().trim().min(1, 'Address is required').max(500).optional(),
);

export const updateRestaurantSchema = z
  .object({
    name: z.string().trim().min(1, 'Restaurant name is required').max(120).optional(),
    logo: optionalText,
    coverImage: optionalText,
    address: requiredAddress,
    phone: requiredPhone,
    email: optionalEmail,
    description: requiredDescription,
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
