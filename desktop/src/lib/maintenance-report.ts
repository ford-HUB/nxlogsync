import { REPORT_TEMPLATES } from '@/constants/excel-report'
import { findWorkActivity } from '@/constants/work-activities'
import { buildRequestHours } from '@/lib/hour-placement'
import { buildOverview } from '@/lib/overview-phrasing'
import type { GeneratedReport, ImportedRow, ImportedSheet, ReportKind } from '@/types/excel-report'

const sumHours = (rows: ImportedRow[]) => rows.reduce((sum, r) => sum + (r.hours ?? 0), 0)

/** The report's figures from the extracted entries; rows flagged Invalid (no hours) are left out. */
export function generateReport(sheet: ImportedSheet, kind: ReportKind): GeneratedReport {
  const template = REPORT_TEMPLATES[kind]
  const usable = sheet.rows.filter((r) => r.status !== 'error')

  const activityHours = new Map<string, number>()
  for (const r of usable) activityHours.set(r.workAccount, (activityHours.get(r.workAccount) ?? 0) + (r.hours ?? 0))

  return {
    kind,
    title: `${sheet.month.split(' ')[0].toUpperCase()} ${kind} MONTHLY MAINTENANCE REPORT`,
    overview: buildOverview(
      usable.map((r) => r.remarks),
      kind,
    ),
    planHours: template.planHours,
    actualHours: sumHours(usable),
    workingDays: new Set(usable.map((r) => r.date)).size,
    byWorkActivity: [...activityHours]
      .map(([code, hours]) => ({ code, name: findWorkActivity(code)?.name ?? 'Not a Work Activity', hours }))
      .sort((a, b) => b.hours - a.hours),
    byJob: template.jobs.map((job) => ({
      code: job.code,
      name: job.name,
      hours: sumHours(usable.filter((r) => r.jobCode === job.code)),
    })),
    requests: buildRequestHours(usable, kind),
  }
}
