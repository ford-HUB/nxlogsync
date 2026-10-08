import { formatHours } from '../../../shared/utils/work-minutes-utils';
import { MailMessage } from '../brevo-mail-client';
import { ReminderEmailContent } from './reminder-email-content';
import { renderReminderHtml } from './reminder-email-html';
import { renderReminderText } from './reminder-email-text';

/** A work day logged short of the target. */
export interface ShortDay {
  day: Date;
  loggedMinutes: number;
  /** After the send day: listed so the whole month is covered, not yet late. */
  upcoming?: boolean;
}

/** The month-end report, or the opt-in reminder on one of the user's work days. */
export type ReminderKind = 'month-end' | 'day';

export interface ReminderEmailData {
  to: string;
  kind: ReminderKind;
  /** The first day checked, and the last (the month's last day for the month-end report). */
  from: Date;
  through: Date;
  /** How many work days between `from` and `through` were checked. */
  checkedDays: number;
  shortDays: ShortDay[];
  targetMinutes: number;
  /** Sent from Settings › Reminder › Send test rather than by the schedule. */
  test?: boolean;
  /** Public URL of the logo; email clients block embedded images. Text wordmark when absent. */
  logoUrl?: string;
}

const TEST_NOTE =
  'This is a test message sent from Settings › Reminder to confirm that reminders reach this address. It covers the month so far.';
const FOOTER =
  'This is an automated message from NXLogSync. You are receiving it because email reminders are enabled for your account. To change the reminder time or work days, or to turn reminders off, open NXLogSync and go to Settings › Reminder.';

/** The "log your hours" report (month-end or day-of): subject, HTML (table layout, inline styles) and plain text. */
export function renderReminderEmail(data: ReminderEmailData): MailMessage {
  const content = buildReminderContent(data);
  return {
    to: data.to,
    subject: content.subject,
    html: renderReminderHtml(content),
    text: renderReminderText(content),
  };
}

function buildReminderContent(data: ReminderEmailData): ReminderEmailContent {
  const { from, through, shortDays, targetMinutes } = data;
  const monthLabel = through.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const periodLabel = `${from.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}–${through.getDate()}, ${through.getFullYear()}`;
  const missingMinutes = shortDays.reduce(
    (sum, d) => sum + Math.max(0, targetMinutes - d.loggedMinutes),
    0,
  );
  const count = shortDays.length;
  const daysWord = count === 1 ? 'day' : 'days';
  const upcoming = shortDays.filter((d) => d.upcoming).length;
  const upcomingNote =
    upcoming === 0
      ? ''
      : ` ${upcoming === count ? (count === 1 ? 'It is' : 'All are') : `${upcoming} of them ${upcoming === 1 ? 'is' : 'are'}`} still ahead this month.`;
  const prefix = data.test ? '[Test] ' : '';
  const monthEnd = data.kind === 'month-end';

  // Scheduled reminders only go out when a day is short; a test can find none.
  const complete = count === 0;
  const subject = complete
    ? `${prefix}Your time log for ${monthLabel} is complete`
    : `${prefix}Reminder: ${count} ${daysWord} in ${monthLabel} under ${formatHours(targetMinutes)}`;
  const heading = complete
    ? 'Your time log is complete'
    : `${count} ${daysWord} still need hours`;
  const summary = complete
    ? `Every work day from ${periodLabel} has at least the required ${formatHours(targetMinutes)} recorded.`
    : `This is your ${monthEnd ? 'month-end' : 'daily'} reminder. Of the ${data.checkedDays} work days from ${periodLabel}, ${count} ${count === 1 ? 'has' : 'have'} less than the required ${formatHours(targetMinutes)} recorded.${upcomingNote}`;
  const action = complete
    ? 'No further action is needed. Your entries will be uploaded to N-PAX at the next scheduled sync.'
    : monthEnd
      ? 'Please complete these days in NXLogSync before the month closes, so that your manhour allocation on N-PAX is complete and ready for endorsement.'
      : 'Please complete these days in NXLogSync while they are fresh. You will also receive the month-end reminder two days before the month closes.';

  return {
    label: monthEnd ? 'Month-end reminder' : 'Daily reminder',
    subject,
    heading,
    summary,
    action,
    periodLabel,
    checkedDays: String(data.checkedDays),
    shortDays: String(count),
    missing: formatHours(missingMinutes),
    missingMinutes,
    rows: shortDays.map((d) => ({
      dayLabel: `${d.day.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}${d.upcoming ? ' (upcoming)' : ''}`,
      logged: formatHours(d.loggedMinutes),
      missing: formatHours(Math.max(0, targetMinutes - d.loggedMinutes)),
    })),
    required: formatHours(targetMinutes),
    testNote: data.test ? TEST_NOTE : undefined,
    footer: FOOTER,
    logoUrl: data.logoUrl,
  };
}
