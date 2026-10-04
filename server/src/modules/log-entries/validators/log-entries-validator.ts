import { z } from 'zod';
import { WORK_ACTIVITY_CODES } from '../../../shared/constants/work-activities';

export const DateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date');

const MinutesSchema = z.number().int().min(0).max(1440);

const EntryFields = {
  startMinutes: MinutesSchema,
  endMinutes: MinutesSchema,
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or fewer'),
  // Optional so clients that don't send it yet keep working; omitted on update = unchanged.
  workActivityCode: z.enum(WORK_ACTIVITY_CODES).nullable().optional(),
  jobCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{1,50}$/, 'Use an N-PAX job code like CL00-00003-001')
    .nullable()
    .optional(),
};

const endsAfterStart = {
  check: (e: { startMinutes: number; endMinutes: number }) =>
    e.endMinutes > e.startMinutes,
  params: {
    message: 'End time must be after the start time',
    path: ['endMinutes'],
  },
};

export const CreateLogEntrySchema = z
  .object({ date: DateKeySchema, ...EntryFields })
  .strict()
  .refine(endsAfterStart.check, endsAfterStart.params);

export const UpdateLogEntrySchema = z
  .object(EntryFields)
  .strict()
  .refine(endsAfterStart.check, endsAfterStart.params);

export const ListLogEntriesQuerySchema = z
  .object({ from: DateKeySchema, to: DateKeySchema })
  .strict()
  .refine((q) => q.from <= q.to, {
    message: '"from" must not be after "to"',
    path: ['from'],
  });

export const LogEntryResponseSchema = z.object({
  id: z.string(),
  date: z.string(),
  startMinutes: z.number(),
  endMinutes: z.number(),
  description: z.string(),
  workActivityCode: z.string().nullable(),
  jobCode: z.string().nullable(),
  syncedAt: z.string().nullable(),
});
