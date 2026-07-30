import { z } from 'zod';
import { RestaurantStatus } from '../generated/prisma/client.js';
import { openingHoursSchema } from './openingHours.validators.js';

const optionalText = z.string().trim().max(500).nullish();
const phoneRegex = /^[+]?[\d\s().-]{7,40}$/;

const optionalEmail = z.preprocess(
  (value) => (value === '' ? null : value),
  z.email('Please enter a valid email address.').nullish(),
);

const optionalUrl = z.preprocess(
  (value) => (value === '' ? null : value),
  z.url('Please enter a valid URL.').nullish(),
);

const requiredPhone = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(phoneRegex, 'Please enter a valid phone number.')
    .optional(),
);

const requiredDescription = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.string().trim().min(1, 'Description is required.').max(2000).optional(),
);

const requiredAddress = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.string().trim().min(1, 'Address is required.').max(500).optional(),
);

const optionalLocationText = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().trim().max(120).nullish(),
);

const optionalPostalCode = z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().trim().max(32).nullish(),
);

const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90.')
  .max(90, 'Latitude must be between -90 and 90.')
  .nullish();

const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180.')
  .max(180, 'Longitude must be between -180 and 180.')
  .nullish();

export const updateRestaurantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Restaurant name is required.')
      .max(120, 'Restaurant name must be at most 120 characters.')
      .optional(),
    logo: optionalText,
    coverImage: optionalText,
    address: requiredAddress,
    city: optionalLocationText,
    state: optionalLocationText,
    country: optionalLocationText,
    postalCode: optionalPostalCode,
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    phone: requiredPhone,
    email: optionalEmail,
    description: requiredDescription,
    facebook: optionalUrl,
    instagram: optionalUrl,
    telegram: optionalUrl,
    openingHours: openingHoursSchema.optional(),
    status: z.enum([RestaurantStatus.ACTIVE, RestaurantStatus.MAINTENANCE]).optional(),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.latitude !== undefined && data.latitude !== null;
    const hasLng = data.longitude !== undefined && data.longitude !== null;
    const clearingLat = data.latitude === null;
    const clearingLng = data.longitude === null;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: 'custom',
        message: 'Both latitude and longitude are required together.',
        path: hasLat ? ['longitude'] : ['latitude'],
      });
    }

    if (clearingLat !== clearingLng) {
      ctx.addIssue({
        code: 'custom',
        message: 'Clear both latitude and longitude together.',
        path: clearingLat ? ['longitude'] : ['latitude'],
      });
    }
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

export const updateRestaurantStatusSchema = z.object({
  status: z.enum([RestaurantStatus.ACTIVE, RestaurantStatus.MAINTENANCE]),
});

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type UpdateRestaurantStatusInput = z.infer<typeof updateRestaurantStatusSchema>;
