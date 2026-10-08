import { formatHours } from '../../../shared/utils/work-minutes-utils';
import { MailMessage } from '../brevo-mail-client';

// The desktop app's palette (index.css), as hex for email clients.
const COLOR = {
  page: '#f4f4f5',
  card: '#ffffff',
  text: '#171717',
  muted: '#737373',
  border: '#e5e5e5',
  track: '#f0f0f0',
  progress: '#e17100',
  done: '#009966',
};
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export interface ReminderEmailData {
  to: string;
  day: Date;
  loggedMinutes: number;
  targetMinutes: number;
  /** Sent from Settings › Reminder › Send test rather than by the schedule. */
  test?: boolean;
  /** Public URL of the logo; email clients block embedded images. Text wordmark when absent. */
  logoUrl?: string;
}

/** The "log your hours" reminder: subject, HTML (table layout, inline styles) and plain text. */
export function renderReminderEmail(data: ReminderEmailData): MailMessage {
  const { day, loggedMinutes, targetMinutes } = data;
  const dayLabel = day.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const shortDay = day.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const remaining = Math.max(0, targetMinutes - loggedMinutes);
  const percent = Math.min(
    100,
    Math.round((loggedMinutes / targetMinutes) * 100),
  );
  const nothingLogged = loggedMinutes === 0;
  const prefix = data.test ? '[Test] ' : '';

  // Scheduled reminders only go out for short days; a test can land on a complete one.
  const complete = remaining === 0;
  const subject = complete
    ? `${prefix}Your time log for ${shortDay} is complete`
    : nothingLogged
      ? `${prefix}Reminder: No hours logged for ${shortDay}`
      : `${prefix}Reminder: Your time log for ${shortDay} is incomplete`;
  const heading = complete
    ? 'Your time log is complete'
    : nothingLogged
      ? 'No hours have been logged yet'
      : 'Your time log is not yet complete';
  const summary = complete
    ? `Your time log for ${dayLabel} has ${formatHours(loggedMinutes)} recorded, which meets the required ${formatHours(targetMinutes)}.`
    : nothingLogged
      ? `This is a reminder that no work has been recorded in your time log for ${dayLabel}. A full working day requires ${formatHours(targetMinutes)}.`
      : `This is a reminder that your time log for ${dayLabel} currently has ${formatHours(loggedMinutes)} recorded against the required ${formatHours(targetMinutes)}.`;
  const action = complete
    ? 'No further action is needed. Your entries will be uploaded to N-PAX at the next scheduled sync.'
    : 'Please record your remaining work in NXLogSync before the scheduled sync to N-PAX, so that your manhour allocation is complete and ready for endorsement.';
  const testNote =
    'This is a test message sent from Settings › Reminder to confirm that reminders reach this address.';
  const footer =
    'This is an automated message from NXLogSync. You are receiving it because email reminders are enabled for your account. To change the reminder time or days, or to turn reminders off, open NXLogSync and go to Settings › Reminder.';

  const text = [
    `NXLogSync — Time log reminder${data.test ? ' (test)' : ''}`,
    '',
    'Hello,',
    '',
    summary,
    '',
    `Date:           ${dayLabel}`,
    `Hours logged:   ${formatHours(loggedMinutes)}`,
    `Required:       ${formatHours(targetMinutes)}`,
    `Remaining:      ${formatHours(remaining)}`,
    '',
    action,
    ...(data.test ? ['', testNote] : []),
    '',
    'Thank you,',
    'NXLogSync',
    '',
    '—',
    footer,
    'Please do not reply to this email; this mailbox is not monitored.',
  ].join('\n');

  const brand = data.logoUrl
    ? `<img src="${escapeHtml(data.logoUrl)}" alt="NXLogSync" height="32" style="display:block;height:32px;border:0;">`
    : `<span style="font-size:18px;font-weight:700;letter-spacing:-0.2px;color:${COLOR.text};">NXLogSync</span>`;

  const stat = (label: string, value: string, color = COLOR.text) => `
    <td width="33%" style="padding:14px 16px;vertical-align:top;">
      <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">${label}</div>
      <div style="padding-top:4px;font-size:18px;font-weight:600;color:${color};">${value}</div>
    </td>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page};font-family:${FONT};color:${COLOR.text};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 4px 16px;">${brand}</td>
        </tr>
        <tr>
          <td style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:12px;padding:32px;">
            ${
              data.test
                ? `<div style="margin-bottom:20px;padding:10px 14px;border-radius:8px;background:${COLOR.track};font-size:13px;color:${COLOR.muted};">${escapeHtml(testNote)}</div>`
                : ''
            }
            <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">Time log reminder · ${escapeHtml(dayLabel)}</div>
            <h1 style="margin:8px 0 20px;font-size:22px;line-height:1.3;font-weight:600;color:${COLOR.text};">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hello,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(summary)}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLOR.border};border-radius:8px;">
              <tr>
                ${stat('Logged', formatHours(loggedMinutes))}
                ${stat('Required', formatHours(targetMinutes))}
                ${stat('Remaining', formatHours(remaining), remaining > 0 ? COLOR.progress : COLOR.done)}
              </tr>
              <tr>
                <td colspan="3" style="padding:0 16px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.track};border-radius:4px;">
                    <tr>
                      ${
                        percent > 0
                          ? `<td width="${percent}%" style="height:8px;line-height:8px;font-size:0;background:${COLOR.progress};border-radius:4px;">&nbsp;</td>`
                          : ''
                      }
                      ${percent < 100 ? `<td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td>` : ''}
                    </tr>
                  </table>
                  <div style="padding-top:6px;font-size:12px;color:${COLOR.muted};">${percent}% of the working day recorded</div>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">${escapeHtml(action)}</p>
            <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Thank you,<br>NXLogSync</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:${COLOR.muted};">
            ${escapeHtml(footer)}<br>
            Please do not reply to this email; this mailbox is not monitored.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { to: data.to, subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
