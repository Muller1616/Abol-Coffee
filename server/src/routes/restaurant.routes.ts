import { Router } from 'express';
import {
  getRestaurantHandler,
  updateRestaurantHandler,
  updateRestaurantStatusHandler,
} from '../controllers/restaurant.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import {
  updateRestaurantSchema,
  updateRestaurantStatusSchema,
} from '../validators/restaurant.validators.js';

const restaurantRouter = Router();

restaurantRouter.use(authenticate);

restaurantRouter.get('/', getRestaurantHandler);

restaurantRouter.patch('/', verifyCsrf, validate(updateRestaurantSchema), updateRestaurantHandler);

restaurantRouter.patch(
  '/status',
  verifyCsrf,
  validate(updateRestaurantStatusSchema),
  updateRestaurantStatusHandler,
);

export { restaurantRouter };
