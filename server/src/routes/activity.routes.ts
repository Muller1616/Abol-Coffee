import { Router } from 'express';
import {
  bulkDeleteActivitiesHandler,
  deleteActivityHandler,
  getActivityHandler,
  listActivitiesHandler,
} from '../controllers/activity.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import {
  activityIdParamsSchema,
  bulkDeleteActivitiesSchema,
  listActivitiesQuerySchema,
} from '../validators/activity.validators.js';

const activityRouter = Router();

activityRouter.use(authenticate);

activityRouter.get('/', validate(listActivitiesQuerySchema, 'query'), listActivitiesHandler);

activityRouter.post(
  '/bulk-delete',
  verifyCsrf,
  validate(bulkDeleteActivitiesSchema),
  bulkDeleteActivitiesHandler,
);

activityRouter.get(
  '/:id',
  validate(activityIdParamsSchema, 'params'),
  getActivityHandler,
);

activityRouter.delete(
  '/:id',
  verifyCsrf,
  validate(activityIdParamsSchema, 'params'),
  deleteActivityHandler,
);

export { activityRouter };
