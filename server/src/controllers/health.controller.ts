import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      data: {
        status: 'ok',
        database: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    logger.error('Health check failed — database unreachable', { error });

    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      data: {
        status: 'degraded',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  }
}
