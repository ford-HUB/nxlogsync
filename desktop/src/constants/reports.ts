import type { EntriesReport, ReportEntry } from '@/types/reports'

/** The longest span one report covers (the server enforces the same). */
export const MAX_REPORT_MONTHS = 12

/** How far back the month pickers reach. */
export const REPORT_MONTHS_BACK = 36

/** How long "Copied" shows after copying the report as text. */
export const REPORT_COPIED_MS = 2000

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

/** "2026-10-08" → "2026-10" */
export function toMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7)
}

/** ("2026-01", -1) → "2025-12" */
export function shiftMonthKey(key: string, months: number): string {
  const [year, month] = key.split('-').map(Number)
  const index = year * 12 + month - 1 + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

/** Whole months from `from` to `to`, counting both. */
export function monthSpan(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return ty * 12 + tm - (fy * 12 + fm) + 1
}

/** "2026-10" → "October 2026" */
export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return MONTH_LABEL_FORMAT.format(new Date(year, month - 1, 1))
}

/** "October 2026", or "September 2026 – October 2026" */
export function formatPeriodLabel(from: string, to: string): string {
  return from === to ? formatMonthLabel(from) : `${formatMonthLabel(from)} – ${formatMonthLabel(to)}`
}

/** 60 → "1 hour", 90 → "1.5 hours" */
export function formatHours(minutes: number): string {
  const hours = Math.round((minutes / 60) * 100) / 100
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
}

/** "Job Name | Task Description | 2026-10-06 | 1 hour" */
export function formatReportLine(entry: ReportEntry): string {
  return [entry.jobName, entry.description, entry.date, formatHours(entry.minutes)].join(' | ')
}

/** Each month's label, then one line per entry; months are separated by a blank line. */
export function formatReportText(report: EntriesReport): string {
  return report.months
    .filter((m) => m.entries.length > 0)
    .map((m) => [m.label, ...m.entries.map(formatReportLine)].join('\n'))
    .join('\n\n')
}
