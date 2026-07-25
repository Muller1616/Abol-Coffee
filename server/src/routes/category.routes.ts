import { Router } from 'express';
import {
  createCategoryHandler,
  deleteCategoryHandler,
  getCategoryHandler,
  listCategoriesHandler,
  reorderCategoriesHandler,
  updateCategoryHandler,
  updateCategoryStatusHandler,
} from '../controllers/category.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import {
  categoryIdParamsSchema,
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from '../validators/category.validators.js';

const categoryRouter = Router();

categoryRouter.use(authenticate);

categoryRouter.get('/', listCategoriesHandler);

categoryRouter.post('/', verifyCsrf, validate(createCategorySchema), createCategoryHandler);

categoryRouter.patch(
  '/reorder',
  verifyCsrf,
  validate(reorderCategoriesSchema),
  reorderCategoriesHandler,
);

categoryRouter.get('/:id', validate(categoryIdParamsSchema, 'params'), getCategoryHandler);

categoryRouter.patch(
  '/:id',
  verifyCsrf,
  validate(categoryIdParamsSchema, 'params'),
  validate(updateCategorySchema),
  updateCategoryHandler,
);

categoryRouter.patch(
  '/:id/status',
  verifyCsrf,
  validate(categoryIdParamsSchema, 'params'),
  validate(updateCategoryStatusSchema),
  updateCategoryStatusHandler,
);

categoryRouter.delete(
  '/:id',
  verifyCsrf,
  validate(categoryIdParamsSchema, 'params'),
  deleteCategoryHandler,
);

export { categoryRouter };
