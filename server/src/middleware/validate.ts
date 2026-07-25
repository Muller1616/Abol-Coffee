import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

type RequestTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodType, target: RequestTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target]);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      next(new AppError('Validation failed', 400, details));
      return;
    }

    if (target === 'query') {
      req.validatedQuery = parsed.data;
    } else if (target === 'params') {
      req.validatedParams = parsed.data;
      Object.assign(req.params, parsed.data);
    } else {
      req.validatedBody = parsed.data;
      req.body = parsed.data;
    }

    next();
  };
}
