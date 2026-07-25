import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { uploadConfig, type ImageVariant } from '../config/upload.js';
import { AppError } from '../utils/AppError.js';

function resolveAbsolutePath(publicPath: string): string {
  const relative = publicPath.replace(new RegExp(`^${uploadConfig.publicPathPrefix}/?`), '');
  return path.join(uploadConfig.uploadsRoot, relative);
}

export async function ensureUploadDirectories(): Promise<void> {
  const folders = Object.values(uploadConfig.variants).map((variant) =>
    path.join(uploadConfig.uploadsRoot, variant.folder),
  );

  await Promise.all(folders.map((folder) => mkdir(folder, { recursive: true })));
}

export async function processAndStoreImage(
  file: Express.Multer.File,
  variant: ImageVariant,
): Promise<string> {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype as (typeof uploadConfig.allowedMimeTypes)[number])) {
    throw new AppError('Only JPG, JPEG, PNG, and WebP images are allowed', 400);
  }

  const settings = uploadConfig.variants[variant];
  const filename = `${randomUUID()}.webp`;
  const absoluteDir = path.join(uploadConfig.uploadsRoot, settings.folder);
  const absolutePath = path.join(absoluteDir, filename);
  const publicPath = `${uploadConfig.publicPathPrefix}/${settings.folder}/${filename}`;

  await mkdir(absoluteDir, { recursive: true });

  try {
    await sharp(file.buffer, { failOn: 'error' })
      .rotate()
      .resize({
        width: settings.maxWidth,
        withoutEnlargement: true,
      })
      .webp({ quality: settings.quality })
      .toFile(absolutePath);
  } catch {
    throw new AppError('Invalid or corrupted image file', 400);
  }

  return publicPath;
}

export async function deleteStoredImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith(`${uploadConfig.publicPathPrefix}/`)) {
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
