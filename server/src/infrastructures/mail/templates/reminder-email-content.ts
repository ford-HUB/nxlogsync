/** One short day as the renderers show it. */
export interface ShortDayRow {
  dayLabel: string;
  logged: string;
  missing: string;
}

/** Everything the HTML and plain-text renderers show, worked out once. */
export interface ReminderEmailContent {
  /** "Month-end reminder" or "Daily reminder", shown above the heading. */
  label: string;
  subject: string;
  heading: string;
  summary: string;
  action: string;
  periodLabel: string;
  checkedDays: string;
  shortDays: string;
  missing: string;
  missingMinutes: number;
  rows: ShortDayRow[];
  required: string;
  /** Shown only on a test send. */
  testNote?: string;
  footer: string;
  logoUrl?: string;
}

export const NO_REPLY_NOTE =
  'Please do not reply to this email; this mailbox is not monitored.';
