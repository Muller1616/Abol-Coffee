import { z } from 'zod';

export const cloudinaryImageUrlSchema = z.object({
  imageUrl: z.string().url('A valid image URL is required'),
});
