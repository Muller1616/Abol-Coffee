import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { uploadConfig } from '../config/upload.js';
import { AppError } from '../utils/AppError.js';

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: uploadConfig.maxFileSizeBytes,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (
      !uploadConfig.allowedMimeTypes.includes(
        file.mimetype as (typeof uploadConfig.allowedMimeTypes)[number],
      )
    ) {
      callback(new AppError('Only JPG, JPEG, PNG, and WebP images are allowed', 400));
      return;
    }

    callback(null, true);
  },
});

export function uploadSingleImage(fieldName = 'image') {
  const middleware = memoryUpload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (error: unknown) => {
      if (!error) {
        if (!req.file) {
          next(new AppError('Image file is required', 400));
          return;
        }

        next();
        return;
      }

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          next(new AppError('Image must be 5 MB or smaller', 400));
          return;
        }

        next(new AppError(error.message, 400));
        return;
      }

      next(error);
    });
  };
}
