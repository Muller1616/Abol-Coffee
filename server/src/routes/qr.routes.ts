import { Router } from 'express';
import {
  downloadQrPngHandler,
  downloadQrSvgHandler,
  getQrPreviewHandler,
  getQrUrlHandler,
  regeneratePublicMenuTokenHandler,
} from '../controllers/qr.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyCsrf } from '../middleware/csrf.js';

const qrRouter = Router({ mergeParams: true });

qrRouter.use(authenticate);

qrRouter.get('/', getQrPreviewHandler);
qrRouter.get('/url', getQrUrlHandler);
qrRouter.get('/png', downloadQrPngHandler);
qrRouter.get('/svg', downloadQrSvgHandler);
qrRouter.post('/regenerate-token', verifyCsrf, regeneratePublicMenuTokenHandler);

export { qrRouter };
