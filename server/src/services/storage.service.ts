import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { getCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { uploadConfig, type ImageVariant } from '../config/upload.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const CLOUDINARY_ROOT_FOLDER = 'abol-coffee';

function resolveAbsolutePath(publicPath: string): string {
  const relative = publicPath.replace(new RegExp(`^${uploadConfig.publicPathPrefix}/?`), '');
  return path.join(uploadConfig.uploadsRoot, relative);
}

function isLocalUploadPath(value: string): boolean {
  return value.startsWith(`${uploadConfig.publicPathPrefix}/`);
}

function isCloudinaryUrl(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return hostname === 'res.cloudinary.com' || hostname.endsWith('.cloudinary.com');
  } catch {
    return false;
  }
}

/** Extract Cloudinary public_id from a delivery URL (with or without version / transforms). */
export function extractCloudinaryPublicId(imageUrl: string): string | null {
  try {
    const { pathname } = new URL(imageUrl);
    const marker = '/upload/';
    const idx = pathname.indexOf(marker);
    if (idx === -1) return null;

    let rest = pathname.slice(idx + marker.length);
    // Drop transformation segments and version prefix (v123456/).
    const parts = rest.split('/').filter(Boolean);
    while (parts.length > 0) {
      const head = parts[0]!;
      if (/^v\d+$/.test(head) || head.includes(',') || head.includes('_')) {
        parts.shift();
        continue;
      }
      break;
    }

    if (parts.length === 0) return null;
    const joined = parts.join('/');
    return joined.replace(/\.[a-zA-Z0-9]+$/, '');
  } catch {
    return null;
  }
}

async function optimizeToWebpBuffer(
  file: Express.Multer.File,
  variant: ImageVariant,
): Promise<Buffer> {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype as (typeof uploadConfig.allowedMimeTypes)[number])) {
    throw AppError.field(
      'image',
      'Only JPG, JPEG, PNG, and WebP images are allowed. Please choose a supported image file.',
    );
  }

  const settings = uploadConfig.variants[variant];

  try {
    return await sharp(file.buffer, { failOn: 'error' })
      .rotate()
      .resize({
        width: settings.maxWidth,
        withoutEnlargement: true,
      })
      .webp({ quality: settings.quality })
      .toBuffer();
  } catch {
    throw AppError.field(
      'image',
      'This image appears to be invalid or corrupted. Please try another file.',
    );
  }
}

async function uploadToCloudinary(buffer: Buffer, variant: ImageVariant): Promise<string> {
  const cloudinary = getCloudinary();
  const settings = uploadConfig.variants[variant];
  const folder = `${CLOUDINARY_ROOT_FOLDER}/${settings.folder}`;
  const publicId = randomUUID();

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
        overwrite: false,
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error('Cloudinary upload returned no URL'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    Readable.from(buffer).pipe(stream);
  });
}

async function storeLocally(buffer: Buffer, variant: ImageVariant): Promise<string> {
  const settings = uploadConfig.variants[variant];
  const filename = `${randomUUID()}.webp`;
  const absoluteDir = path.join(uploadConfig.uploadsRoot, settings.folder);
  const absolutePath = path.join(absoluteDir, filename);
  const publicPath = `${uploadConfig.publicPathPrefix}/${settings.folder}/${filename}`;

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, buffer);
  return publicPath;
}

/**
 * Process an uploaded image and persist it.
 * Production requires Cloudinary. Development falls back to local disk when Cloudinary is unset.
 * Returns a durable URL (Cloudinary HTTPS) or a legacy `/uploads/...` path.
 */
export async function processAndStoreImage(
  file: Express.Multer.File,
  variant: ImageVariant,
): Promise<string> {
  const buffer = await optimizeToWebpBuffer(file, variant);

  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(buffer, variant);
    } catch (error) {
      logger.error('Cloudinary upload failed', { error, variant });
      throw AppError.field(
        'image',
        'Unable to store image. Please try again in a moment.',
        502,
      );
    }
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Cloudinary is required in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
    );
  }

  logger.warn('Cloudinary not configured — storing image on local disk (development only)', {
    variant,
  });
  return storeLocally(buffer, variant);
}

export async function deleteStoredImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath) return;

  if (isCloudinaryUrl(publicPath)) {
    if (!isCloudinaryConfigured()) {
      logger.warn('Skipping Cloudinary delete — credentials not configured', { publicPath });
      return;
    }

    const publicId = extractCloudinaryPublicId(publicPath);
    if (!publicId) {
      logger.warn('Could not parse Cloudinary public_id for delete', { publicPath });
      return;
    }

    try {
      await getCloudinary().uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      logger.error('Cloudinary delete failed', { error, publicId });
    }
    return;
  }

  if (!isLocalUploadPath(publicPath)) {
    return;
  }

  const absolutePath = resolveAbsolutePath(publicPath);

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

/** Ensure local upload dirs exist when running without Cloudinary (dev / legacy). */
export async function ensureUploadDirectories(): Promise<void> {
  if (isCloudinaryConfigured()) return;

  const folders = Object.values(uploadConfig.variants).map((variant) =>
    path.join(uploadConfig.uploadsRoot, variant.folder),
  );

  await Promise.all(folders.map((folder) => mkdir(folder, { recursive: true })));
}

export function usesCloudinaryStorage(): boolean {
  return isCloudinaryConfigured();
}
