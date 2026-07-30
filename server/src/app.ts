import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { appConfig } from './config/app.js';
import { env } from './config/env.js';
import { uploadConfig } from './config/upload.js';
import { gzipCompression } from './middleware/compression.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(gzipCompression);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    uploadConfig.publicPathPrefix,
    express.static(uploadConfig.uploadsRoot, {
      // Missing files fall through to the global 404 handler (avoid raw 500s).
      fallthrough: true,
      // Uploaded files use UUID filenames → safe to cache aggressively.
      maxAge: env.NODE_ENV === 'production' ? '30d' : 0,
      immutable: env.NODE_ENV === 'production',
      etag: true,
      lastModified: true,
    }),
  );

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Restaurant QR Digital Menu API',
    });
  });

  app.use(appConfig.apiPrefix, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
