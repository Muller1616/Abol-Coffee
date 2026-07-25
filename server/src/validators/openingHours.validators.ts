import { z } from 'zod';
import { WEEKDAYS, type OpeningHours } from '../types/openingHours.js';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const dayHoursSchema = z
  .object({
    isClosed: z.boolean(),
    open: z.string().regex(timeRegex, 'Open time must be HH:mm').nullable(),
    close: z.string().regex(timeRegex, 'Close time must be HH:mm').nullable(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) {
      if (day.open !== null || day.close !== null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Closed days must not include open or close times',
        });
      }
      return;
    }

    if (day.open === null || day.close === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Open days require both open and close times',
      });
      return;
    }

    if (day.open >= day.close) {
      ctx.addIssue({
        code: 'custom',
        message: 'Open time must be earlier than close time',
      });
    }
  });

export const openingHoursSchema = z.object(
  Object.fromEntries(WEEKDAYS.map((day) => [day, dayHoursSchema])) as Record<
    (typeof WEEKDAYS)[number],
    typeof dayHoursSchema
  >,
) satisfies z.ZodType<OpeningHours>;
