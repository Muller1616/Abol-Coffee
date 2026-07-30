import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../utils/AppError.js'

type RequestTarget = 'body' | 'query' | 'params'

function zodIssuesToErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): Record<string, string> {
  const errors: Record<string, string> = {}

  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form'
    if (!errors[key]) {
      errors[key] = issue.message
    }
  }

  return errors
}

export function validate(schema: ZodType, target: RequestTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[target])

    if (!parsed.success) {
      const errors = zodIssuesToErrors(parsed.error.issues)
      next(
        new AppError('Validation failed.', 400, {
          errors,
        }),
      )
      return
    }

    if (target === 'query') {
      req.validatedQuery = parsed.data
    } else if (target === 'params') {
      req.validatedParams = parsed.data
      Object.assign(req.params, parsed.data)
    } else {
      req.validatedBody = parsed.data
      req.body = parsed.data
    }

    next()
  }
}
