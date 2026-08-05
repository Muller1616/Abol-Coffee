import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  getCloudinary,
  getCloudinaryUploadPreset,
  isCloudinaryConfigured,
} from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { uploadConfig, type ImageVariant } from '../config/upload.js';
import { AppError } from '../utils/AppError.js';

const CLOUDINARY_ROOT_FOLDER = 'abol-coffee';

export const cloudinarySignSchema = z.object({
  variant: z.enum(['menuItem', 'logo', 'cover']),
});

export type CloudinarySignInput = z.infer<typeof cloudinarySignSchema>;

export type CloudinaryUploadSign =
  | {
      mode: 'unsigned';
      cloudName: string;
      uploadPreset: string;
      folder: string;
    }
  | {
      mode: 'signed';
      cloudName: string;
      apiKey: string;
      timestamp: number;
      publicId: string;
      signature: string;
    };

function folderForVariant(variant: ImageVariant): string {
  return `${CLOUDINARY_ROOT_FOLDER}/${uploadConfig.variants[variant].folder}`;
}

/**
 * Browser upload credentials.
 * Prefer an unsigned upload preset when configured (most reliable for SPAs).
 * Otherwise return a SHA-256 signed payload.
 */
export function createCloudinaryUploadSign(variant: ImageVariant): CloudinaryUploadSign {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the API.',
      503,
    );
  }

  const cloudName = env.CLOUDINARY_CLOUD_NAME!;
  const folder = folderForVariant(variant);
  const preset = getCloudinaryUploadPreset();

  if (preset) {
    return {
      mode: 'unsigned',
      cloudName,
      uploadPreset: preset,
      folder,
    };
  }

  const apiKey = env.CLOUDINARY_API_KEY!;
  const apiSecret = env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.round(Date.now() / 1000);
  // Single public_id (includes folder path) — avoids folder+public_id signature mismatches.
  const publicId = `${folder}/${randomUUID()}`;

  // Explicit SHA-256 signature (Cloudinary rejects SHA-1 on newer accounts).
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha256').update(toSign).digest('hex');

  // Keep SDK config in sync for destroy/other calls.
  getCloudinary();

  return {
    mode: 'signed',
    cloudName,
    apiKey,
    timestamp,
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

  const cloudName = env.CLOUDINARY_CLOUD_NAME!;
  if (parsed.hostname !== 'res.cloudinary.com' && !parsed.hostname.endsWith('.cloudinary.com')) {
    throw AppError.field('image', 'Image URL must be a Cloudinary delivery URL.');
  }

  if (!parsed.pathname.includes(`/${cloudName}/`)) {
    throw AppError.field('image', 'Image URL does not belong to this Cloudinary account.');
  }

  return parsed.toString();
}
