import { z } from 'zod';

export const SCHEDULE_MODES = [
  'daily',
  'interval',
  'monthly',
  'manual',
] as const;
export const RUN_TRIGGERS = ['scheduled', 'manual'] as const;
export const RUN_STATUSES = [
  'running',
  'success',
  'failed',
  'skipped',
] as const;

const MinuteOfDaySchema = z.number().int().min(0).max(1439);

export const SyncScheduleSchema = z
  .object({
    enabled: z.boolean(),
    mode: z.enum(SCHEDULE_MODES),
    dailyAtMinutes: MinuteOfDaySchema,
    intervalHours: z.number().int().min(1).max(12),
    windowStartMinutes: MinuteOfDaySchema,
    windowEndMinutes: MinuteOfDaySchema,
    days: z.array(z.number().int().min(0).max(6)).max(7),
    monthlyDaysBeforeEnd: z.number().int().min(0).max(7),
    monthlyWeekdaysOnly: z.boolean(),
    targetUrl: z
      .string()
      .trim()
      .regex(
        /^https:\/\/\S+\.\S+/,
        'Enter a full https:// address for the target site.',
      ),
    retryAttempts: z.number().int().min(0).max(10),
    skipEmptyDays: z.boolean(),
  })
  .strict()
  .refine(
    (s) => s.mode === 'manual' || s.mode === 'monthly' || s.days.length > 0,
    { message: 'Pick at least one day to sync on.', path: ['days'] },
  )
  .refine(
    (s) => s.mode !== 'interval' || s.windowEndMinutes > s.windowStartMinutes,
    {
      message: 'The window must end after it starts.',
      path: ['windowEndMinutes'],
    },
  );

export const ListSyncRunsQuerySchema = z
  .object({ limit: z.coerce.number().int().min(1).max(100).optional() })
  .strict();

export const ENDORSE_OUTCOMES = [
  'endorsed',
  'short-day',
  'not-saved',
  'no-time-record',
] as const;

export const EndorseDaySchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a day as YYYY-MM-DD.'),
  })
  .strict();

export const EndorseDayResponseSchema = z.object({
  date: z.string(),
  outcome: z.enum(ENDORSE_OUTCOMES),
});

export const SyncRunResponseSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  trigger: z.enum(RUN_TRIGGERS),
  status: z.enum(RUN_STATUSES),
  entryCount: z.number(),
  minutes: z.number(),
  message: z.string().nullable(),
});

export const PendingUploadResponseSchema = z.object({
  days: z.number(),
  minutes: z.number(),
});
