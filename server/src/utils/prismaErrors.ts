import { Prisma } from '../generated/prisma/client.js';
import { AppError } from './AppError.js';

export function handlePrismaError(error: unknown, fallbackMessage: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new AppError('A record with this value already exists', 409);
    }

    if (error.code === 'P2025') {
      throw new AppError('Record not found', 404);
    }
  }

  if (error instanceof AppError) {
    throw error;
  }

  throw new AppError(fallbackMessage, 500);
}
