import type {
  ConnectionStatus,
  ScheduleIssue,
  ScheduleMode,
  ScheduleState,
  SyncRunStatus,
  SyncSchedule,
  SyncTrigger,
  Weekday,
} from '@/types/sync-schedule'

export const SCHEDULE_MODES: ScheduleMode[] = ['daily', 'interval', 'monthly', 'manual']

export const SCHEDULE_MODE_LABEL: Record<ScheduleMode, string> = {
  daily: 'Once a day',
  interval: 'Repeat',
  monthly: 'Once a month',
  manual: 'Manual only',
}

export const SCHEDULE_MODE_HINT: Record<ScheduleMode, string> = {
  daily: 'Upload the day’s entries to the target site at one fixed time.',
  interval: 'Upload repeatedly during working hours so the target site stays current.',
  monthly: 'Upload the whole month’s entries once, a set number of days before the month ends.',
  manual: 'Nothing runs on its own. Use Sync now whenever you want to upload.',
}

/** Monday-first display order. */
export const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0]
export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}
export const WORKWEEK: Weekday[] = [1, 2, 3, 4, 5]

export const INTERVAL_HOUR_OPTIONS = [1, 2, 3, 4, 6]
export const RETRY_OPTIONS = [0, 1, 3, 5]

/** How far ahead to look for the next run before giving up. */
export const UPCOMING_LOOKAHEAD_DAYS = 14
export const UPCOMING_PREVIEW_COUNT = 4
export const UPCOMING_LOOKAHEAD_MONTHS = 12

/** Recent syncs shown before "Show all". */
export const RUN_HISTORY_PAGE_SIZE = 5

/** 0 = last day of the month. */
export const MONTHLY_OFFSET_OPTIONS = Array.from({ length: 8 }, (_, i) => i)

export function formatMonthlyOffset(daysBeforeEnd: number): string {
  if (daysBeforeEnd === 0) return 'Last day of the month'
  return `${daysBeforeEnd} ${daysBeforeEnd === 1 ? 'day' : 'days'} before the last day`
}

export const CREDENTIALS_INVALID_MESSAGE = 'The site rejected this User ID and password.'

/** How often the screen re-reads the server's session status (the server checks the site on its own schedule). */
export const SESSION_POLL_MS = 15_000

/** How often the screen re-reads runs and pending minutes; scheduled runs fire on the server. */
export const RUNS_POLL_MS = 15_000
/** Faster polling while a run is in progress, so its outcome shows promptly. */
export const ACTIVE_RUN_POLL_MS = 2_000

export const TARGET_SITE_NAME = 'NX Timesheet portal'

/** Stands in for the server's schedule until it loads (the screen shows a skeleton meanwhile). Matches the server's defaults. */
export const FALLBACK_SCHEDULE: SyncSchedule = {
  enabled: false,
  mode: 'daily',
  dailyAtMinutes: 18 * 60,
  intervalHours: 2,
  windowStartMinutes: 8 * 60,
  windowEndMinutes: 18 * 60,
  days: [1, 2, 3, 4, 5],
  monthlyDaysBeforeEnd: 0,
  monthlyWeekdaysOnly: true,
  targetUrl: 'https://workflow.n-pax.com/index.aspx',
  retryAttempts: 3,
  skipEmptyDays: true,
}

export const SCHEDULE_ISSUE_MESSAGE: Record<ScheduleIssue, string> = {
  'no-days': 'Pick at least one day to sync on.',
  'window-order': 'The window must end after it starts.',
  'invalid-url': 'Enter a full https:// address for the target site.',
}

export const SCHEDULE_STATE_LABEL: Record<ScheduleState, string> = {
  scheduled: 'Scheduled',
  paused: 'Paused',
  manual: 'Manual only',
}

export const SCHEDULE_STATE_BADGE: Record<ScheduleState, string> = {
  scheduled: 'bg-success/15 text-success',
  paused: 'bg-warning/15 text-warning',
  manual: 'bg-muted text-muted-foreground',
}

export const RUN_STATUS_LABEL: Record<SyncRunStatus, string> = {
  success: 'Uploaded',
  failed: 'Failed',
  skipped: 'Skipped',
  running: 'Syncing',
}

export const RUN_STATUS_BADGE: Record<SyncRunStatus, string> = {
  success: 'bg-success/15 text-success',
  failed: 'bg-destructive/10 text-destructive',
  skipped: 'bg-muted text-muted-foreground',
  running: 'bg-muted text-foreground',
}

export const RUN_STATUS_DOT: Record<SyncRunStatus, string> = {
  success: 'bg-success',
  failed: 'bg-destructive',
  skipped: 'bg-muted-foreground/40',
  running: 'bg-foreground',
}

export const RUN_TRIGGER_LABEL: Record<SyncTrigger, string> = {
  scheduled: 'Scheduled',
  manual: 'Manual',
}

export const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  connected: 'Connected',
  checking: 'Checking…',
  reconnecting: 'Reconnecting…',
  unreachable: 'Unreachable',
  disconnected: 'Not connected',
}

export const CONNECTION_DOT: Record<ConnectionStatus, string> = {
  connected: 'bg-success',
  checking: 'bg-muted-foreground/40',
  reconnecting: 'bg-warning',
  unreachable: 'bg-destructive',
  disconnected: 'bg-muted-foreground/40',
}

const RUN_TIME_FORMAT = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const RUN_DAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
export const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** Time until a run: "45m", "2h 45m", "2d 17h". */
export function formatUntil(minutes: number): string {
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const rest = minutes % 60
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`
  if (hours > 0) return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
  return `${rest}m`
}

/** "Today, 6:00 PM" · "Tomorrow, 9:00 AM" · "Mon, Oct 5, 6:00 PM" */
export function formatRunTime(date: Date, now: Date): string {
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000)
  const time = RUN_TIME_FORMAT.format(date)
  if (dayDiff === 0) return `Today, ${time}`
  if (dayDiff === 1) return `Tomorrow, ${time}`
  if (dayDiff === -1) return `Yesterday, ${time}`
  return `${RUN_DAY_FORMAT.format(date)}, ${time}`
}
