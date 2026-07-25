import { Router } from 'express';
import { getDashboardHandler } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { dashboardQuerySchema } from '../validators/dashboard.validators.js';

const dashboardRouter = Router();

dashboardRouter.use(authenticate);

dashboardRouter.get('/', validate(dashboardQuerySchema, 'query'), getDashboardHandler);

export { dashboardRouter };
