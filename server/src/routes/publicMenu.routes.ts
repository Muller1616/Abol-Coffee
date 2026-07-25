import { Router } from 'express';
import { getPublicMenuHandler } from '../controllers/publicMenu.controller.js';
import { noStore } from '../middleware/noStore.js';
import { validate } from '../middleware/validate.js';
import { publicMenuQuerySchema } from '../validators/publicMenu.validators.js';

const publicMenuRouter = Router();

publicMenuRouter.use(noStore);

publicMenuRouter.get('/', validate(publicMenuQuerySchema, 'query'), getPublicMenuHandler);

export { publicMenuRouter };
