import { Router } from 'express';
import { activityRouter } from './activity.routes.js';
import { authRouter } from './auth.routes.js';
import { categoryRouter } from './category.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { healthRouter } from './health.routes.js';
import { menuItemRouter } from './menuItem.routes.js';
import { publicMenuRouter } from './publicMenu.routes.js';
import { qrRouter } from './qr.routes.js';
import { restaurantRouter } from './restaurant.routes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/dashboard', dashboardRouter);
apiRouter.use('/admin/activities', activityRouter);
apiRouter.use('/admin/restaurant', restaurantRouter);
apiRouter.use('/admin/categories', categoryRouter);
apiRouter.use('/admin/menu-items', menuItemRouter);
apiRouter.use('/admin/qr', qrRouter);
apiRouter.use('/public/menu', publicMenuRouter);

export { apiRouter };
