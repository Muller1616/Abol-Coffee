import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { categoryRouter } from './category.routes.js';
import { healthRouter } from './health.routes.js';
import { restaurantRouter } from './restaurant.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/restaurant', restaurantRouter);
apiRouter.use('/admin/categories', categoryRouter);

export { apiRouter };
