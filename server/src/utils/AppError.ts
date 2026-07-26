export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly details?: unknown;
  readonly field?: string;

  constructor(
    message: string,
    statusCode = 500,
    details?: unknown,
    isOperational = true,
    field?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    this.field = field;
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
