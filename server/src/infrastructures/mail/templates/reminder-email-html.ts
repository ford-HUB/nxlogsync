import { NO_REPLY_NOTE, ReminderEmailContent } from './reminder-email-content';

// The desktop app's palette (index.css), as hex for email clients.
export const COLOR = {
  page: '#f4f4f5',
  card: '#ffffff',
  text: '#171717',
  muted: '#737373',
  border: '#e5e5e5',
  track: '#f0f0f0',
  progress: '#e17100',
  done: '#009966',
};
export const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** The HTML part: table layout and inline styles, since email clients strip <style> and flex/grid. */
export function renderReminderHtml(content: ReminderEmailContent): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.page};font-family:${FONT};color:${COLOR.text};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.summary)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 4px 16px;">${brand(content.logoUrl)}</td>
        </tr>
        <tr>
          <td style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:12px;padding:32px;">
            ${
              content.testNote
                ? `<div style="margin-bottom:20px;padding:10px 14px;border-radius:8px;background:${COLOR.track};font-size:13px;color:${COLOR.muted};">${escapeHtml(content.testNote)}</div>`
                : ''
            }
            <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">${escapeHtml(content.label)} · ${escapeHtml(content.periodLabel)}</div>
            <h1 style="margin:8px 0 20px;font-size:22px;line-height:1.3;font-weight:600;color:${COLOR.text};">${escapeHtml(content.heading)}</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hello,</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${escapeHtml(content.summary)}</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLOR.border};border-radius:8px;">
              <tr>
                ${stat('Work days', content.checkedDays)}
                ${stat('Short days', content.shortDays, content.rows.length > 0 ? COLOR.progress : COLOR.done)}
                ${stat('Missing', content.missing, content.missingMinutes > 0 ? COLOR.progress : COLOR.done)}
              </tr>
            </table>
            ${shortDayTable(content)}

            <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">${escapeHtml(content.action)}</p>
            <p style="margin:24px 0 0;font-size:15px;line-height:1.6;">Thank you,<br>NXLogSync</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:${COLOR.muted};">
            ${escapeHtml(content.footer)}<br>
            ${escapeHtml(NO_REPLY_NOTE)}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Logo plus wordmark; the wordmark alone when there is no logo URL or images are blocked. */
export function brand(logoUrl?: string): string {
  const wordmark = `<span style="font-size:18px;font-weight:700;letter-spacing:-0.2px;color:${COLOR.text};">NXLogSync</span>`;
  if (!logoUrl) return wordmark;
  // Square logo: explicit width+height attributes, or Outlook renders it at its natural 2048px.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;"><img src="${escapeHtml(logoUrl)}" alt="NXLogSync" width="32" height="32" style="display:block;width:32px;height:32px;border:0;outline:none;text-decoration:none;"></td>
            <td style="vertical-align:middle;">${wordmark}</td>
          </tr></table>`;
}

/** The short days, one row each; nothing when the month is complete. */
function shortDayTable(content: ReminderEmailContent): string {
  if (content.rows.length === 0) return '';
  const cell = `padding:10px 16px;font-size:14px;border-top:1px solid ${COLOR.border};`;
  const head = `padding:10px 16px;font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};`;
  const rows = content.rows
    .map(
      (r) => `
              <tr>
                <td style="${cell}">${escapeHtml(r.dayLabel)}</td>
                <td align="right" style="${cell}">${escapeHtml(r.logged)}</td>
                <td align="right" style="${cell}color:${COLOR.progress};font-weight:600;">${escapeHtml(r.missing)}</td>
              </tr>`,
    )
    .join('');
  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border:1px solid ${COLOR.border};border-radius:8px;">
              <tr>
                <td style="${head}">Date</td>
                <td align="right" style="${head}">Logged</td>
                <td align="right" style="${head}">Missing</td>
              </tr>${rows}
            </table>
            <div style="padding-top:6px;font-size:12px;color:${COLOR.muted};">A full working day requires ${escapeHtml(content.required)}.</div>`;
}

function stat(label: string, value: string, color = COLOR.text): string {
  return `
    <td width="33%" style="padding:14px 16px;vertical-align:top;">
      <div style="font-size:11px;letter-spacing:0.6px;text-transform:uppercase;color:${COLOR.muted};">${label}</div>
      <div style="padding-top:4px;font-size:18px;font-weight:600;color:${color};">${value}</div>
    </td>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
