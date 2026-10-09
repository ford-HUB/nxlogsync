import type { Weekday } from './sync-schedule'

/** What the user picks: when the server emails them to log their hours. */
export interface ReminderSchedule {
  enabled: boolean
  /** Minutes since local midnight. */
  atMinutes: number
  /** Work days checked for missing hours; also the day-of reminder days when `nudge` is on. */
  days: Weekday[]
  /** Also email at `atMinutes` on each of `days` while any day so far is short. */
  nudge: boolean
}

export interface ReminderSettings extends ReminderSchedule {
  /** The Email on N-PAX's Present Address Update; null until the server has read one. */
  email: string | null
  emailFetchedAt: string | null
  /** "YYYY-MM-DD" of the last day reminded. */
  lastSentDate: string | null
  /** "YYYY-MM-DD" of the last day-of reminder. */
  lastNudgeDate: string | null
}
