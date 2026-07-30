import { Router } from 'express';
import { getPublicMenuHandler } from '../controllers/publicMenu.controller.js';
import { validate } from '../middleware/validate.js';
import { publicMenuQuerySchema } from '../validators/publicMenu.validators.js';

const publicMenuRouter = Router();

publicMenuRouter.get('/', validate(publicMenuQuerySchema, 'query'), getPublicMenuHandler);

export { publicMenuRouter };
