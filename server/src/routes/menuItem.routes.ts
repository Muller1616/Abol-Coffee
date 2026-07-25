import { Router } from 'express';
import {
  removeMenuItemImageHandler,
  uploadMenuItemImageHandler,
} from '../controllers/image.controller.js';
import {
  createMenuItemHandler,
  deleteMenuItemHandler,
  getMenuItemHandler,
  listMenuItemsHandler,
  reorderMenuItemsHandler,
  updateMenuItemAvailabilityHandler,
  updateMenuItemHandler,
} from '../controllers/menuItem.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { uploadSingleImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  createMenuItemSchema,
  listMenuItemsQuerySchema,
  menuItemIdParamsSchema,
  reorderMenuItemsSchema,
  updateMenuItemAvailabilitySchema,
  updateMenuItemSchema,
} from '../validators/menuItem.validators.js';

const menuItemRouter = Router();

menuItemRouter.use(authenticate);

menuItemRouter.get('/', validate(listMenuItemsQuerySchema, 'query'), listMenuItemsHandler);

menuItemRouter.post('/', verifyCsrf, validate(createMenuItemSchema), createMenuItemHandler);

menuItemRouter.patch(
  '/reorder',
  verifyCsrf,
  validate(reorderMenuItemsSchema),
  reorderMenuItemsHandler,
);

menuItemRouter.get('/:id', validate(menuItemIdParamsSchema, 'params'), getMenuItemHandler);

menuItemRouter.patch(
  '/:id',
  verifyCsrf,
  validate(menuItemIdParamsSchema, 'params'),
  validate(updateMenuItemSchema),
  updateMenuItemHandler,
);

menuItemRouter.patch(
  '/:id/availability',
  verifyCsrf,
  validate(menuItemIdParamsSchema, 'params'),
  validate(updateMenuItemAvailabilitySchema),
  updateMenuItemAvailabilityHandler,
);

menuItemRouter.post(
  '/:id/image',
  verifyCsrf,
  validate(menuItemIdParamsSchema, 'params'),
  uploadSingleImage('image'),
  uploadMenuItemImageHandler,
);

menuItemRouter.delete(
  '/:id/image',
  verifyCsrf,
  validate(menuItemIdParamsSchema, 'params'),
  removeMenuItemImageHandler,
);

menuItemRouter.delete(
  '/:id',
  verifyCsrf,
  validate(menuItemIdParamsSchema, 'params'),
  deleteMenuItemHandler,
);

export { menuItemRouter };
