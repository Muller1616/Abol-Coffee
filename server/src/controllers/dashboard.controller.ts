import type { NextFunction, Request, Response } from 'express';
import { getDashboard } from '../services/dashboard.service.js';
import type { DashboardQuery } from '../validators/dashboard.validators.js';

export async function getDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = (req.validatedQuery as DashboardQuery | undefined) ?? { recentLimit: 10 };
    const dashboard = await getDashboard(query.recentLimit);

    res.status(200).json({
      success: true,
      message: 'Dashboard retrieved',
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
}
