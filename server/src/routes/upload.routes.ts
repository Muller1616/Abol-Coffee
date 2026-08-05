import { Router } from 'express';
import { signCloudinaryUploadHandler } from '../controllers/image.controller.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { cloudinarySignSchema } from '../services/cloudinarySign.service.js';

const uploadRouter = Router();

uploadRouter.post(
  '/cloudinary-sign',
  verifyCsrf,
  validate(cloudinarySignSchema),
  signCloudinaryUploadHandler,
);

export { uploadRouter };
