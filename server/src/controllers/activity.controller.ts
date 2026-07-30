import type { NextFunction, Request, Response } from 'express';
import { listAdminActivities } from '../services/activity.service.js';
import type { ListActivitiesQuery } from '../validators/activity.validators.js';

export async function listActivitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = (req.validatedQuery as ListActivitiesQuery | undefined) ?? {
      page: 1,
      pageSize: 20,
    };
    const data = await listAdminActivities(query);

    res.status(200).json({
      success: true,
      message: 'Activities fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}
