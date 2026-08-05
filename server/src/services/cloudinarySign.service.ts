import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadConfig, type ImageVariant } from '../config/upload.js';
import { AppError } from '../utils/AppError.js';

const CLOUDINARY_ROOT_FOLDER = 'abol-coffee';

export const cloudinarySignSchema = z.object({
  variant: z.enum(['menuItem', 'logo', 'cover']),
});

export type CloudinarySignInput = z.infer<typeof cloudinarySignSchema>;

export type CloudinaryUploadSign = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
};

/**
 * Signed params for browser → Cloudinary direct upload.
 * Avoids sending image bytes through Vercel (4.5MB proxy limit).
 */
export function createCloudinaryUploadSign(variant: ImageVariant): CloudinaryUploadSign {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the API.',
      503,
    );
  }

  const cloudinary = getCloudinary();
  const settings = uploadConfig.variants[variant];
  const folder = `${CLOUDINARY_ROOT_FOLDER}/${settings.folder}`;
  const publicId = randomUUID();
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
      public_id: publicId,
    },
    cloudinary.config().api_secret as string,
  );

  return {
    cloudName: cloudinary.config().cloud_name as string,
    apiKey: cloudinary.config().api_key as string,
    timestamp,
    folder,
    publicId,
    signature,
  };
}

export function assertOwnedCloudinaryUrl(imageUrl: string): string {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Cloudinary is not configured on the server.', 503);
  }

  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw AppError.field('image', 'Invalid image URL.');
  }

  if (parsed.protocol !== 'https:') {
    throw AppError.field('image', 'Image URL must be HTTPS.');
  }

  const cloudName = getCloudinary().config().cloud_name as string;
  const expectedHost = 'res.cloudinary.com';
  if (parsed.hostname !== expectedHost && !parsed.hostname.endsWith('.cloudinary.com')) {
    throw AppError.field('image', 'Image URL must be a Cloudinary delivery URL.');
  }

  if (!parsed.pathname.includes(`/${cloudName}/`)) {
    throw AppError.field('image', 'Image URL does not belong to this Cloudinary account.');
  }

  return parsed.toString();
}
