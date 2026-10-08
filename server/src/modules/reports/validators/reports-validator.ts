import { z } from 'zod';

/** The longest span one report covers. */
export const MAX_REPORT_MONTHS = 12;

const MonthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use a YYYY-MM month');

function monthIndex(key: string): number {
  const [year, month] = key.split('-').map(Number);
  return year * 12 + month - 1;
}

export const EntriesReportQuerySchema = z
  .object({ from: MonthKeySchema, to: MonthKeySchema })
  .strict()
  .refine((q) => q.from <= q.to, {
    message: '"from" must not be after "to"',
    path: ['from'],
  })
  .refine((q) => monthIndex(q.to) - monthIndex(q.from) < MAX_REPORT_MONTHS, {
    message: `A report covers at most ${MAX_REPORT_MONTHS} months`,
    path: ['to'],
  });

export const ReportEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  startMinutes: z.number(),
  endMinutes: z.number(),
  jobCode: z.string().nullable(),
  /** The job's client name from the user's lookup; the code when it isn't listed there. */
  jobName: z.string(),
  workActivityCode: z.string().nullable(),
  description: z.string(),
  /** Work minutes, lunch break left out. */
  minutes: z.number(),
});

export const ReportMonthSchema = z.object({
  /** "YYYY-MM" */
  month: z.string(),
  /** "October 2026" */
  label: z.string(),
  totalMinutes: z.number(),
  entries: z.array(ReportEntrySchema),
});

export const EntriesReportResponseSchema = z.object({
  employee: z.string(),
  from: z.string(),
  to: z.string(),
  generatedAt: z.string(),
  totalMinutes: z.number(),
  entryCount: z.number(),
  dayCount: z.number(),
  /** Every month in the range, oldest first, including months without entries. */
  months: z.array(ReportMonthSchema),
});
