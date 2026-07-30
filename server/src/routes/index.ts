import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRestaurantAccess } from '../middleware/requireRestaurantAccess.js';
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

apiRouter.use(apiRateLimiter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/public/menu', publicMenuRouter);

/** Owner workspace APIs — scoped by restaurant slug + ownership check. */
const ownerWorkspaceRouter = Router({ mergeParams: true });
ownerWorkspaceRouter.use(authenticate, requireRestaurantAccess);
ownerWorkspaceRouter.use('/dashboard', dashboardRouter);
ownerWorkspaceRouter.use('/activities', activityRouter);
ownerWorkspaceRouter.use('/restaurant', restaurantRouter);
ownerWorkspaceRouter.use('/categories', categoryRouter);
ownerWorkspaceRouter.use('/menu-items', menuItemRouter);
ownerWorkspaceRouter.use('/qr', qrRouter);

apiRouter.use('/r/:restaurantSlug', ownerWorkspaceRouter);

export { apiRouter };
