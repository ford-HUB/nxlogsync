import type { ReminderSettings } from '@/types/reminders'

/** Shown (locked) until the signed-in user's settings load. */
export const FALLBACK_REMINDER: ReminderSettings = {
  enabled: false,
  atMinutes: 17 * 60,
  days: [1, 2, 3, 4, 5],
  email: null,
  emailFetchedAt: null,
  lastSentDate: null,
}

/** Reading the email drives N-PAX in a headless browser, behind any sync already queued. */
export const REMINDER_EMAIL_TIMEOUT_MS = 600_000

export const REMINDER_NO_DAYS_MESSAGE = 'Pick at least one day to be reminded on.'
export const REMINDER_HINT = 'Emails you at this time when the day has less than 9 hours logged.'
export const REMINDER_EMAIL_SOURCE = 'From N-PAX · Personnel › Present Address Update'
