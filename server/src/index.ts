import 'dotenv/config';

async function main(): Promise<void> {
  const { env, isCloudinaryEnvConfigured } = await import('./config/env.js');
  const { prisma } = await import('./config/database.js');
  const { createApp } = await import('./app.js');
  const { ensureUploadDirectories, usesCloudinaryStorage } = await import(
    './services/storage.service.js'
  );
  const { logger } = await import('./utils/logger.js');

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error('Database connection failed on startup', { error });
    throw new Error(
      'Missing or unreachable database.\nDATABASE_URL connection failed.\nApplication cannot start.',
    );
  }

  await ensureUploadDirectories();

  try {
    const { purgeNonBusinessActivities } = await import('./services/activity.service.js');
    await purgeNonBusinessActivities();
  } catch (error) {
    logger.warn('Activity history cleanup skipped', { error });
  }

  // Warm public menu cache so the first guest request avoids a cold Neon round-trip.
  try {
    const { prisma: db } = await import('./config/database.js');
    const restaurant = await db.restaurant.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { publicMenuToken: true },
    });
    if (restaurant?.publicMenuToken) {
      const { getPublicMenu } = await import('./services/publicMenu.service.js');
      await getPublicMenu(restaurant.publicMenuToken, {});
    }
  } catch (error) {
    logger.warn('Public menu warm-up skipped', { error });
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : env.PORT;
    logger.info('Abol Coffee API started', {
      env: env.NODE_ENV,
      port,
      storage: usesCloudinaryStorage() || isCloudinaryEnvConfigured() ? 'cloudinary' : 'local-disk',
      publicMenuUrl: env.PUBLIC_MENU_URL,
    });
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use. Stop the other process or set a free PORT.`, {
        error,
      });
    } else {
      logger.error('Failed to start API server', { error });
    }
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    server.close(async (closeError) => {
      if (closeError) {
        logger.error('Error while closing HTTP server', { error: closeError });
      }

      try {
        await prisma.$disconnect();
      } catch (error) {
        logger.error('Error while disconnecting Prisma', { error });
      }

      process.exit(closeError ? 1 : 0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Application failed to start',
      error: message,
    })}\n`,
  );
  process.exit(1);
});
