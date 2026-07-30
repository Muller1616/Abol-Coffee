import path from 'node:path';
import { env } from './env.js';

export const uploadConfig = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  uploadsRoot: path.resolve(env.UPLOADS_DIR?.trim() || path.join(process.cwd(), 'uploads')),
  publicPathPrefix: '/uploads',
  variants: {
    menuItem: {
      folder: 'menu-items',
      maxWidth: 1600,
      quality: 80,
    },
    logo: {
      folder: 'restaurant/logo',
      maxWidth: 800,
      quality: 85,
    },
    cover: {
      folder: 'restaurant/cover',
      maxWidth: 1920,
      quality: 80,
    },
  },
} as const;

export type ImageVariant = keyof typeof uploadConfig.variants;
