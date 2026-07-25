import { Router } from 'express';
import {
  removeRestaurantCoverHandler,
  removeRestaurantLogoHandler,
  uploadRestaurantCoverHandler,
  uploadRestaurantLogoHandler,
} from '../controllers/image.controller.js';
import {
  getRestaurantHandler,
  updateRestaurantHandler,
  updateRestaurantStatusHandler,
} from '../controllers/restaurant.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { uploadSingleImage } from '../middleware/upload.js';
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

restaurantRouter.post(
  '/logo',
  verifyCsrf,
  uploadSingleImage('image'),
  uploadRestaurantLogoHandler,
);

restaurantRouter.delete('/logo', verifyCsrf, removeRestaurantLogoHandler);

restaurantRouter.post(
  '/cover',
  verifyCsrf,
  uploadSingleImage('image'),
  uploadRestaurantCoverHandler,
);

restaurantRouter.delete('/cover', verifyCsrf, removeRestaurantCoverHandler);

export { restaurantRouter };
