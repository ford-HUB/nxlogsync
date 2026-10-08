import { NO_REPLY_NOTE, ReminderEmailContent } from './reminder-email-content';

/** The plain-text part, for clients that don't render HTML. */
export function renderReminderText(content: ReminderEmailContent): string {
  return [
    `NXLogSync — ${content.label}${content.testNote ? ' (test)' : ''}`,
    '',
    'Hello,',
    '',
    content.summary,
    '',
    `Period:         ${content.periodLabel}`,
    `Work days:      ${content.checkedDays}`,
    `Short days:     ${content.shortDays}`,
    `Missing:        ${content.missing}`,
    ...(content.rows.length > 0
      ? [
          '',
          ...content.rows.map(
            (r) =>
              `  ${r.dayLabel.padEnd(14)}${r.logged} logged, ${r.missing} missing`,
          ),
        ]
      : []),
    '',
    content.action,
    ...(content.testNote ? ['', content.testNote] : []),
    '',
    'Thank you,',
    'NXLogSync',
    '',
    '—',
    content.footer,
    NO_REPLY_NOTE,
  ].join('\n');
}
