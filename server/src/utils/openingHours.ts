import { Prisma } from '../generated/prisma/client.js';
import {
  WEEKDAYS,
  type DayHours,
  type OpeningHours,
  createDefaultOpeningHours,
} from '../types/openingHours.js';
import { openingHoursSchema } from '../validators/openingHours.validators.js';
import { AppError } from './AppError.js';

function isDayHours(value: unknown): value is DayHours {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record.isClosed === 'boolean';
}

export function parseOpeningHours(value: Prisma.JsonValue): OpeningHours {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return createDefaultOpeningHours();
  }

  const candidate = value as Record<string, unknown>;
  const hasAllDays = WEEKDAYS.every((day) => isDayHours(candidate[day]));

  if (!hasAllDays) {
    return createDefaultOpeningHours();
  }

  const parsed = openingHoursSchema.safeParse(candidate);

  if (!parsed.success) {
    throw new AppError('Stored opening hours are invalid', 500);
  }

  return parsed.data;
}

export function toOpeningHoursJson(hours: OpeningHours): Prisma.InputJsonValue {
  return hours;
}
