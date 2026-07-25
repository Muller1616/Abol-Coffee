import { Router } from 'express';
import {
  downloadQrPngHandler,
  downloadQrSvgHandler,
  getQrPreviewHandler,
  getQrUrlHandler,
} from '../controllers/qr.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const qrRouter = Router();

qrRouter.use(authenticate);

qrRouter.get('/', getQrPreviewHandler);
qrRouter.get('/url', getQrUrlHandler);
qrRouter.get('/png', downloadQrPngHandler);
qrRouter.get('/svg', downloadQrSvgHandler);

export { qrRouter };
