import type { Weekday } from './sync-schedule'

/** What the user picks: when the server emails them to log their hours. */
export interface ReminderSchedule {
  enabled: boolean
  /** Minutes since local midnight. */
  atMinutes: number
  days: Weekday[]
}

export interface ReminderSettings extends ReminderSchedule {
  /** The Email on N-PAX's Present Address Update; null until the server has read one. */
  email: string | null
  emailFetchedAt: string | null
  /** "YYYY-MM-DD" of the last day reminded. */
  lastSentDate: string | null
}
