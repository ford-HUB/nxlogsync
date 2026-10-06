import type { ActivityLevel, DayStatus, WheelOption } from '@/types/daily-log'

export const DAILY_LIMIT_HOURS = 9
export const DAILY_LIMIT_MINUTES = DAILY_LIMIT_HOURS * 60
/** Remaining time at or below this flips the day to "near limit". */
export const NEAR_LIMIT_MINUTES = 60

/** The shift's unpaid break, which N-PAX leaves out of Work Hours. */
export const BREAK_START_MINUTES = 12 * 60
export const BREAK_END_MINUTES = 13 * 60

/**
 * Minutes that count toward the day, as N-PAX counts them: the span less any part
 * of the break it covers — 10:45–15:55 is 4h 10m, not 5h 10m.
 */
export function workMinutes(startMinutes: number, endMinutes: number): number {
  const onBreak = Math.max(
    0,
    Math.min(endMinutes, BREAK_END_MINUTES) - Math.max(startMinutes, BREAK_START_MINUTES),
  )
  return Math.max(0, endMinutes - startMinutes - onBreak)
}

export const MINUTES_PER_DAY = 24 * 60
export const TIME_STEP_MINUTES = 1
export const LAST_SELECTABLE_MINUTE = MINUTES_PER_DAY - TIME_STEP_MINUTES
export const DEFAULT_START_MINUTES = 9 * 60
export const DEFAULT_DRAFT_DURATION_MINUTES = 60

/** N-PAX starts a shift on the next 10-minute mark at or after the time in. */
export const SHIFT_START_STEP_MINUTES = 10

/** The shift start N-PAX assigns a time in: 08:13 → 08:20, 08:20 → 08:20, 08:21 → 08:30. */
export function shiftStartMinutes(timeInMinutes: number): number {
  return Math.ceil(timeInMinutes / SHIFT_START_STEP_MINUTES) * SHIFT_START_STEP_MINUTES
}

export const DESCRIPTION_MAX_LENGTH = 500

/** Placeholder rows in the task list while entries first load. */
export const ENTRY_SKELETON_ROWS = 4

export const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  empty: 'No entries',
  'in-progress': 'In progress',
  'near-limit': 'Near limit',
  full: 'Limit reached',
  'over-limit': 'Overtime',
}

export const DAY_STATUS_BADGE: Record<DayStatus, string> = {
  empty: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-muted text-foreground',
  'near-limit': 'bg-warning/15 text-warning',
  full: 'bg-success/15 text-success',
  'over-limit': 'bg-destructive/10 text-destructive',
}

export const DAY_STATUS_BAR: Record<DayStatus, string> = {
  empty: 'bg-muted-foreground/40',
  'in-progress': 'bg-primary',
  'near-limit': 'bg-warning',
  full: 'bg-success',
  // Over the limit the bar is green up to 9h and red past it; see HoursSummary.
  'over-limit': 'bg-success',
}

// Activity heatmap
/** Weeks shown, oldest → newest — 53 covers a full year whatever weekday today is. */
export const ACTIVITY_WEEKS = 53
/** Rows run Monday → Sunday (a work log's week starts on Monday); alternate rows labelled, as on GitHub. */
export const ACTIVITY_WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

export const ACTIVITY_LEVEL_CELL: Record<ActivityLevel, string> = {
  none: 'bg-foreground/[0.06]',
  low: 'bg-success/25',
  medium: 'bg-success/50',
  high: 'bg-success/75',
  full: 'bg-success',
  over: 'bg-destructive',
}

export const ACTIVITY_LEVEL_LABEL: Record<ActivityLevel, string> = {
  none: 'Nothing logged',
  low: 'Under 3h',
  medium: '3h – 6h',
  high: '6h – 9h',
  full: 'Limit reached',
  over: 'Over limit',
}

/** Legend scale, "Less" → "More". Over-limit is shown apart: it is a status, not more of the scale. */
export const ACTIVITY_SCALE: ActivityLevel[] = ['none', 'low', 'medium', 'high', 'full']

// Time wheel geometry
export const WHEEL_ITEM_HEIGHT = 28
export const WHEEL_VISIBLE_ITEMS = 3
/** Quiet period after scrolling stops before the wheel commits its value. */
export const WHEEL_SETTLE_MS = 120
/** Accumulated wheel delta (px) that advances one item — one mouse notch ≈ 100. */
export const WHEEL_STEP_DELTA = 40

export const HOUR_OPTIONS: WheelOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}))

export const MINUTE_OPTIONS: WheelOption[] = Array.from(
  { length: 60 / TIME_STEP_MINUTES },
  (_, i) => ({
    value: i * TIME_STEP_MINUTES,
    label: String(i * TIME_STEP_MINUTES).padStart(2, '0'),
  }),
)

export const PERIOD_OPTIONS: WheelOption[] = [
  { value: 0, label: 'AM' },
  { value: 1, label: 'PM' },
]
