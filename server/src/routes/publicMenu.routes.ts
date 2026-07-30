import { Router } from 'express';
import { getPublicMenuEntryHandler } from '../controllers/publicEntry.controller.js';
import { getPublicMenuHandler } from '../controllers/publicMenu.controller.js';
import { publicMenuRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { publicMenuQuerySchema } from '../validators/publicMenu.validators.js';

const publicMenuRouter = Router();

publicMenuRouter.get('/entry', publicMenuRateLimiter, getPublicMenuEntryHandler);

publicMenuRouter.get(
  '/:publicMenuToken',
  publicMenuRateLimiter,
  validate(publicMenuQuerySchema, 'query'),
  getPublicMenuHandler,
);

export { publicMenuRouter };
