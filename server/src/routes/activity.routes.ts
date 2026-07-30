import { Router } from 'express';
import { listActivitiesHandler } from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { listActivitiesQuerySchema } from '../validators/activity.validators.js';

const activityRouter = Router();

activityRouter.use(authenticate);

activityRouter.get('/', validate(listActivitiesQuerySchema, 'query'), listActivitiesHandler);

export { activityRouter };
