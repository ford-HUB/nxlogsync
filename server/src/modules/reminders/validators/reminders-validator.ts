import { z } from 'zod';

export const ReminderSettingsSchema = z
  .object({
    enabled: z.boolean(),
    atMinutes: z.number().int().min(0).max(1439),
    days: z.array(z.number().int().min(0).max(6)).max(7),
  })
  .strict()
  .refine((s) => !s.enabled || s.days.length > 0, {
    message: 'Pick at least one day to be reminded on.',
    path: ['days'],
  });

export const ReminderSettingsResponseSchema = z.object({
  enabled: z.boolean(),
  atMinutes: z.number(),
  days: z.array(z.number()),
  /** Read from N-PAX's Present Address Update; null until found. */
  email: z.string().nullable(),
  emailFetchedAt: z.string().nullable(),
  lastSentDate: z.string().nullable(),
});
