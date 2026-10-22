import { formatHours } from '../../../shared/utils/work-minutes-utils';
import { MailMessage } from '../brevo-mail-client';
import { COLOR, FONT, brand, escapeHtml } from './reminder-email-html';
import { NO_REPLY_NOTE } from './reminder-email-content';

export interface AutoEndorseEmailData {
  to: string;
  ranAt: Date;
  /** Days endorsed to the checker, "YYYY-MM-DD" with the work logged. */
  endorsed: { date: string; minutes: number }[];
  /** Days left for the user, each with why. */
  skipped: { date: string; minutes: number; reason: string }[];
  /** Public URL of the logo; email clients block embedded images. Text wordmark when absent. */
  logoUrl?: string;
}

const FOOTER =
  'This is an automated message from NXLogSync, sent after each monthly auto-endorse. Only days synced to N-PAX that meet the 9-hour requirement are endorsed. To change or turn off auto-endorse, open NXLogSync and go to Endorse days.';

/** "2026-10-05" → "Mon, Oct 5" */
function formatDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function dayRows(
  rows: { label: string; value: string; note?: string }[],
): string {
  return rows
    .map(
      (row, i) => `
              <tr>
                <td style="padding:10px 16px;font-size:14px;${i > 0 ? `border-top:1px solid ${COLOR.border};` : ''}">${escapeHtml(row.label)}${
                  row.note
                    ? `<div style="padding-top:2px;font-size:12px;color:${COLOR.muted};">${escapeHtml(row.note)}</div>`
                    : ''
                }</td>
                <td align="right" style="padding:10px 16px;font-size:14px;font-weight:600;white-space:nowrap;${i > 0 ? `border-top:1px solid ${COLOR.border};` : ''}">${escapeHtml(row.value)}</td>
              </tr>`,
    )
    .join('');
}

/** The auto-endorse report: subject, HTML (table layout, inline styles) and plain text. */
export function renderAutoEndorseEmail(
  data: AutoEndorseEmailData,
): MailMessage {
  const ranAt = data.ranAt.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const count = data.endorsed.length;
  const minutes = data.endorsed.reduce((sum, d) => sum + d.minutes, 0);
  const subject =
    count > 0
      ? `Auto-endorse: ${count} ${count === 1 ? 'day' : 'days'} endorsed to your checker`
      : 'Auto-endorse: no days endorsed';
  const heading =
    count > 0
      ? 'Your entries were endorsed'
      : 'No days were endorsed this time';
  const summary =
    count > 0
      ? `Auto-endorse ran on ${ranAt} and endorsed ${count} ${count === 1 ? 'day' : 'days'} (${formatHours(minutes)}) to your checker on N-PAX. Endorsed days can no longer be edited, resynced or cleared.`
      : `Auto-endorse ran on ${ranAt}, but no day met the requirements to be endorsed.`;
  const skippedNote =
    data.skipped.length > 0
      ? `${data.skipped.length} ${data.skipped.length === 1 ? 'day was' : 'days were'} not endorsed. Fix ${data.skipped.length === 1 ? 'it' : 'them'} in NXLogSync, then endorse by hand or wait for next month's run.`
      : null;

  const sectionTitle = (title: string) =>
    `<div style="margin:24px 0 8px;font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">${escapeHtml(title)}</div>`;
  const table = (rows: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLOR.border};border-radius:8px;">${rows}
            </table>`;

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
          <td style="padding:0 4px 16px;">${brand(data.logoUrl)}</td>
        </tr>
        <tr>
          <td style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:12px;padding:32px;">
            <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">Auto-endorse · ${escapeHtml(ranAt)}</div>
            <h1 style="margin:8px 0 20px;font-size:22px;line-height:1.3;font-weight:600;color:${count > 0 ? COLOR.done : COLOR.text};">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hello,</p>
            <p style="margin:0;font-size:15px;line-height:1.6;">${escapeHtml(summary)}</p>
            ${
              count > 0
                ? sectionTitle('Endorsed') +
                  table(
                    dayRows(
                      data.endorsed.map((d) => ({
                        label: formatDay(d.date),
                        value: formatHours(d.minutes),
                      })),
                    ),
                  )
                : ''
            }
            ${
              skippedNote
                ? sectionTitle('Not endorsed') +
                  table(
                    dayRows(
                      data.skipped.map((d) => ({
                        label: formatDay(d.date),
                        value: formatHours(d.minutes),
                        note: d.reason,
                      })),
                    ),
                  ) +
                  `<p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:${COLOR.muted};">${escapeHtml(skippedNote)}</p>`
                : ''
            }
            <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Thank you,<br>NXLogSync</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:${COLOR.muted};">
            ${escapeHtml(FOOTER)}<br>
            ${escapeHtml(NO_REPLY_NOTE)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    'NXLogSync — Auto-endorse report',
    '',
    'Hello,',
    '',
    summary,
    ...(count > 0
      ? [
          '',
          'Endorsed:',
          ...data.endorsed.map(
            (d) => `- ${formatDay(d.date)}: ${formatHours(d.minutes)}`,
          ),
        ]
      : []),
    ...(skippedNote
      ? [
          '',
          'Not endorsed:',
          ...data.skipped.map(
            (d) =>
              `- ${formatDay(d.date)}: ${formatHours(d.minutes)} (${d.reason})`,
          ),
          '',
          skippedNote,
        ]
      : []),
    '',
    'Thank you,',
    'NXLogSync',
    '',
    '—',
    FOOTER,
    NO_REPLY_NOTE,
  ].join('\n');

  return { to: data.to, subject, html, text };
}
