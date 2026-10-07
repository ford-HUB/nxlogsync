/**
 * 'daily' runs once at a set time; 'interval' repeats inside a time window;
 * 'monthly' runs once, a set number of days before the month ends; 'manual' never auto-runs.
 */
export type ScheduleMode = 'daily' | 'interval' | 'monthly' | 'manual'

/** Date#getDay() numbering: 0 = Sunday … 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Times are minutes since local midnight (0–1439). */
export interface SyncSchedule {
  enabled: boolean
  mode: ScheduleMode
  dailyAtMinutes: number
  intervalHours: number
  windowStartMinutes: number
  windowEndMinutes: number
  days: Weekday[]
  /** 0 = last day of the month, 1 = the day before it, … */
  monthlyDaysBeforeEnd: number
  /** When the monthly run lands on Sat/Sun, run on the Friday before instead. */
  monthlyWeekdaysOnly: boolean
  targetUrl: string
  retryAttempts: number
  skipEmptyDays: boolean
}

export type ScheduleState = 'scheduled' | 'paused' | 'manual'

/**
 * 'disconnected' = no verified login yet, or the user logged out.
 * 'reconnecting' = the site expired the session and the server is logging in again.
 */
export type ConnectionStatus = 'connected' | 'checking' | 'reconnecting' | 'unreachable' | 'disconnected'

export interface SyncTarget {
  name: string
  /** Login ID saved for the target site; null until credentials are entered. The password is never kept in renderer state. */
  userId: string | null
  connection: ConnectionStatus
  checkedAt: Date
}

/** The server's view of its N-PAX session (GET /v1/credentials/status). */
export interface SiteSession {
  state: 'connected' | 'reconnecting' | 'unreachable' | 'disconnected'
  userId: string | null
  /** ISO time of the last successful check or login. */
  checkedAt: string | null
  message: string | null
}

/** Outcome of logging in to the target site with a user's credentials. */
export type CredentialsCheck = { status: 'valid' } | { status: 'invalid' | 'error'; message: string }

export type SyncRunStatus = 'success' | 'failed' | 'skipped' | 'running'

export type SyncTrigger = 'scheduled' | 'manual'

export interface SyncRun {
  id: string
  startedAt: Date
  trigger: SyncTrigger
  status: SyncRunStatus
  entryCount: number
  minutes: number
  message?: string
}

/**
 * What endorsing a day did: 'endorsed' = sent to the checker on N-PAX; the rest
 * were left as they were ('short-day' = under 9h logged, 'not-saved' = nothing
 * saved on N-PAX, 'no-time-record' = no shift on N-PAX for the day).
 */
export type EndorseOutcome = 'endorsed' | 'short-day' | 'not-saved' | 'no-time-record'

/** One picked day's progress in the Endorse days dialog. */
export type EndorseDayResult =
  | { status: 'waiting' | 'running' }
  | { status: 'done'; outcome: EndorseOutcome }
  | { status: 'failed'; message: string }

export interface PendingUpload {
  days: number
  minutes: number
}

export type ScheduleIssue = 'no-days' | 'window-order' | 'invalid-url'
