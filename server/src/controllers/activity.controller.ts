import type { NextFunction, Request, Response } from 'express';
import {
  deleteAdminActivities,
  deleteAdminActivity,
  getAdminActivityById,
  listAdminActivities,
} from '../services/activity.service.js';
import type {
  ActivityIdParams,
  BulkDeleteActivitiesInput,
  ListActivitiesQuery,
} from '../validators/activity.validators.js';

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

export async function getActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ActivityIdParams;
    const activity = await getAdminActivityById(id);

    res.status(200).json({
      success: true,
      message: 'Activity retrieved',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ActivityIdParams;
    const data = await deleteAdminActivity(id);

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteActivitiesHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as BulkDeleteActivitiesInput;
    const data = await deleteAdminActivities(body.ids);

    res.status(200).json({
      success: true,
      message:
        data.deletedCount === 1
          ? 'Activity deleted successfully'
          : `${data.deletedCount} activities deleted successfully`,
      data,
    });
  } catch (error) {
    next(error);
  }
}
