import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { categoryRouter } from './category.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { healthRouter } from './health.routes.js';
import { menuItemRouter } from './menuItem.routes.js';
import { publicMenuRouter } from './publicMenu.routes.js';
import { restaurantRouter } from './restaurant.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/dashboard', dashboardRouter);
apiRouter.use('/admin/restaurant', restaurantRouter);
apiRouter.use('/admin/categories', categoryRouter);
apiRouter.use('/admin/menu-items', menuItemRouter);
apiRouter.use('/public/menu', publicMenuRouter);

export { apiRouter };
