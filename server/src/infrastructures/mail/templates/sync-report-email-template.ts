import { formatHours } from '../../../shared/utils/work-minutes-utils';
import { MailMessage } from '../brevo-mail-client';
import { COLOR, FONT, brand, escapeHtml } from './reminder-email-html';
import { NO_REPLY_NOTE } from './reminder-email-content';

export interface SyncReportEmailData {
  to: string;
  status: 'success' | 'failed';
  startedAt: Date;
  /** Days, entries and hours uploaded to N-PAX by the run. */
  days: number;
  entryCount: number;
  minutes: number;
  /** The run's notes (days waiting, retries, errors); null when there are none. */
  message: string | null;
  /** Public URL of the logo; email clients block embedded images. Text wordmark when absent. */
  logoUrl?: string;
}

const FOOTER =
  'This is an automated message from NXLogSync, sent after each scheduled sync to N-PAX that uploads entries or fails. To change the schedule, open NXLogSync and go to Sync Schedule.';

const STATUS = {
  success: {
    label: 'Completed',
    heading: 'Your entries were uploaded to N-PAX',
    color: COLOR.done,
  },
  failed: {
    label: 'Failed',
    heading: 'Your scheduled sync did not finish',
    color: COLOR.progress,
  },
} as const;

/** The scheduled-sync report: subject, HTML (table layout, inline styles) and plain text. */
export function renderSyncReportEmail(data: SyncReportEmailData): MailMessage {
  const status = STATUS[data.status];
  const ranAt = data.startedAt.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const subject = `Scheduled sync to N-PAX: ${status.label}`;
  const summary =
    data.status === 'success'
      ? `The scheduled sync that ran on ${ranAt} uploaded ${data.entryCount} ${data.entryCount === 1 ? 'entry' : 'entries'} (${formatHours(data.minutes)}) across ${data.days} ${data.days === 1 ? 'day' : 'days'}.`
      : `The scheduled sync that ran on ${ranAt} did not upload every day. Days not uploaded stay pending and are tried again on the next sync.`;
  const notes = data.message
    ? data.message.split('. ').map((n) => n.replace(/\.$/, ''))
    : [];

  const stats = [
    ['Status', status.label, status.color],
    ['Days', String(data.days), COLOR.text],
    ['Hours', formatHours(data.minutes), COLOR.text],
  ] as const;

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
            <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">Scheduled sync · ${escapeHtml(ranAt)}</div>
            <h1 style="margin:8px 0 20px;font-size:22px;line-height:1.3;font-weight:600;color:${COLOR.text};">${escapeHtml(status.heading)}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hello,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(summary)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLOR.border};border-radius:8px;">
              <tr>${stats
                .map(
                  ([label, value, color]) => `
                <td width="33%" style="padding:14px 16px;vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">${label}</div>
                  <div style="padding-top:4px;font-size:18px;font-weight:600;color:${color};">${escapeHtml(value)}</div>
                </td>`,
                )
                .join('')}
              </tr>
            </table>
            ${
              notes.length > 0
                ? `<ul style="margin:20px 0 0;padding-left:20px;font-size:14px;line-height:1.6;color:${COLOR.text};">${notes
                    .map(
                      (n) =>
                        `<li style="margin-bottom:6px;">${escapeHtml(n)}</li>`,
                    )
                    .join('')}</ul>`
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
    'NXLogSync — Scheduled sync report',
    '',
    'Hello,',
    '',
    summary,
    '',
    `Status:   ${status.label}`,
    `Days:     ${data.days}`,
    `Entries:  ${data.entryCount}`,
    `Hours:    ${formatHours(data.minutes)}`,
    ...(notes.length > 0 ? ['', ...notes.map((n) => `- ${n}`)] : []),
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
