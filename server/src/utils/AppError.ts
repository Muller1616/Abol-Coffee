export type AppErrorOptions = {
  /** Field-keyed validation / business errors for the API client. */
  errors?: Record<string, string>
  /** When false, the error is treated as unexpected and always logged. */
  isOperational?: boolean
  /** Optional underlying cause for internal logging. */
  cause?: unknown
}

export class AppError extends Error {
  readonly statusCode: number
  readonly isOperational: boolean
  readonly errors?: Record<string, string>
  readonly cause?: unknown

  constructor(message: string, statusCode = 500, options: AppErrorOptions = {}) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = options.isOperational ?? true
    this.errors = options.errors
    this.cause = options.cause
    this.name = 'AppError'
    Object.setPrototypeOf(this, new.target.prototype)
  }

  /** Convenience for a single field-mapped error. */
  static field(field: string, message: string, statusCode = 400): AppError {
    return new AppError(message, statusCode, {
      errors: { [field]: message },
    })
  }
}
