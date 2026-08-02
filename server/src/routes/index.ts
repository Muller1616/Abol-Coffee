import { Router } from 'express';
import { apiRateLimiter } from '../middleware/rateLimit.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  requireOwnerRestaurant,
  requireRestaurantAccess,
} from '../middleware/requireRestaurantAccess.js';
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

function mountOwnerWorkspace(router: Router): void {
  router.use('/dashboard', dashboardRouter);
  router.use('/activities', activityRouter);
  router.use('/restaurant', restaurantRouter);
  router.use('/categories', categoryRouter);
  router.use('/menu-items', menuItemRouter);
  router.use('/qr', qrRouter);
}

/** Owner workspace APIs — scoped by restaurant slug + ownership check. */
const ownerWorkspaceRouter = Router({ mergeParams: true });
ownerWorkspaceRouter.use(authenticate, requireRestaurantAccess);
mountOwnerWorkspace(ownerWorkspaceRouter);
apiRouter.use('/r/:restaurantSlug', ownerWorkspaceRouter);

/**
 * Legacy `/api/admin/*` alias for smoke tests and older clients.
 * Restaurant is resolved from the authenticated owner (single-tenant).
 */
const legacyAdminRouter = Router();
legacyAdminRouter.use(authenticate, requireOwnerRestaurant);
mountOwnerWorkspace(legacyAdminRouter);
apiRouter.use('/admin', legacyAdminRouter);

export { apiRouter };
