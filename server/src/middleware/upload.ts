import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { uploadConfig } from '../config/upload.js'
import { AppError } from '../utils/AppError.js'

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
      callback(
        AppError.field(
          'image',
          'Only JPG, JPEG, PNG, and WebP images are allowed. Please choose a supported image file.',
        ),
      )
      return
    }

    callback(null, true)
  },
})

export function uploadSingleImage(fieldName = 'image') {
  const middleware = memoryUpload.single(fieldName)

  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (error: unknown) => {
      if (!error) {
        if (!req.file) {
          next(
            AppError.field(
              'image',
              'Image file is required. Please select an image to upload.',
            ),
          )
          return
        }

        next()
        return
      }

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          next(AppError.field('image', 'Image must be 5 MB or smaller.'))
          return
        }

        next(AppError.field('image', 'Unable to upload this image. Please try another file.'))
        return
      }

      next(error)
    })
  }
}
