import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError('Route not found', 404))
}

function shouldLog(err: AppError): boolean {
  return !err.isOperational || err.statusCode >= 500
}

function isJsonParseError(err: unknown): boolean {
  if (!(err instanceof SyntaxError)) return false
  const withStatus = err as SyntaxError & { status?: number; type?: string }
  return withStatus.status === 400 || withStatus.type === 'entity.parse.failed'
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isJsonParseError(err)) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.',
      errors: { body: 'Invalid JSON in request body.' },
    })
    return
  }

  if (err instanceof AppError) {
    if (shouldLog(err)) {
      console.error('Operational server error:', {
        message: err.message,
        statusCode: err.statusCode,
        cause: err.cause ?? undefined,
        stack: err.stack,
      })
    }

    const fieldKeys = err.errors ? Object.keys(err.errors) : []
    const singleField = fieldKeys.length === 1 ? fieldKeys[0] : undefined

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && fieldKeys.length > 0 ? { errors: err.errors } : {}),
      ...(singleField ? { field: singleField } : {}),
    })
    return
  }

  console.error('Unhandled error:', err)

  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : 'Unexpected server error',
  })
}
