import type { ReminderSettings } from '@/types/reminders'

/** Shown (locked) until the signed-in user's settings load. */
export const FALLBACK_REMINDER: ReminderSettings = {
  enabled: false,
  atMinutes: 17 * 60,
  days: [1, 2, 3, 4, 5],
  nudge: false,
  email: null,
  emailFetchedAt: null,
  lastSentDate: null,
  lastNudgeDate: null,
}

/** Reading the email drives N-PAX in a headless browser, behind any sync already queued. */
export const REMINDER_EMAIL_TIMEOUT_MS = 600_000

export const REMINDER_NO_DAYS_MESSAGE = 'Pick at least one work day to check.'
export const REMINDER_HINT =
  "Two days before the month ends, emails you at this time a list of the month's work days with less than 9 hours logged, including the days still ahead."
export const REMINDER_NUDGE_LABEL = 'Also remind me on each work day'
export const REMINDER_NUDGE_HINT = 'Only sent when a work day so far this month is short.'
export const REMINDER_EMAIL_SOURCE = 'From N-PAX · Personnel › Present Address Update'
