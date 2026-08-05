import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}

let configured = false;

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
      // Newer Cloudinary accounts reject SHA-1 signed uploads.
      signature_algorithm: 'sha256',
    });
    configured = true;
  }

  return cloudinary;
}

export function getCloudinaryUploadPreset(): string | undefined {
  return env.CLOUDINARY_UPLOAD_PRESET;
}
