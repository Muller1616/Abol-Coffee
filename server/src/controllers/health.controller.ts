import type { Request, Response } from 'express';

export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
}
