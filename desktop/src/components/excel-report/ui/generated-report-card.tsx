import { FileDown, FileSpreadsheet, Sheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { OVERVIEW_WORD_LIMIT } from '@/constants/excel-report'
import { cn } from '@/lib/utils'
import type { GeneratedReport } from '@/types/excel-report'

interface GeneratedReportCardProps {
  report: GeneratedReport
  onExportExcel: () => void
  onExportPdf: () => void
  /** Why the last export failed. */
  exportError?: string | null
}

/**
 * A preview of the filled workbook's front page: actual against plan hours (Support hours), hours
 * per Work Activity, and the Monthly Overview list.
 */
export function GeneratedReportCard({ report, onExportExcel, onExportPdf, exportError }: GeneratedReportCardProps) {
  const variance = report.planHours - report.actualHours
  const usedPct = report.planHours ? Math.min(100, (report.actualHours / report.planHours) * 100) : 0
  const topActivity = report.byWorkActivity[0]?.hours ?? 0

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <FileSpreadsheet className="size-4 text-muted-foreground" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide">{report.title}</h2>
        <Button type="button" variant="outline" size="sm" onClick={onExportExcel}>
          <Sheet />
          Export Excel
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onExportPdf}>
          <FileDown />
          Export PDF
        </Button>
      </div>
      {exportError && (
        <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">
          {exportError}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Actual hours</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">{report.actualHours}</span>
            <span className="text-[12px] text-muted-foreground tabular-nums">of {report.planHours} plan</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${usedPct}%` }} />
          </div>
          <span
            className={cn(
              'text-[12px] tabular-nums',
              variance < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
            )}
          >
            Variance {variance} h · {report.workingDays} days
          </span>
          {report.byJob.length > 1 && (
            <div className="flex flex-col gap-0.5 text-[12px]">
              {report.byJob.map((job) => (
                <span key={job.code} className="flex min-w-0 justify-between gap-3">
                  <span className="truncate text-muted-foreground">
                    <span className="font-mono text-[11px]">{job.code}</span> {job.name}
                  </span>
                  <span className="font-semibold tabular-nums">{job.hours}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="hidden w-px self-stretch bg-border lg:block" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Hours by work activity</span>
          {report.byWorkActivity.map((a) => (
            <div key={a.code} className="flex items-center gap-3 text-[12px]">
              <span className="w-40 min-w-0 shrink-0 truncate">
                <span className="font-mono text-[11px]">{a.code}</span>{' '}
                <span className="text-muted-foreground">{a.name}</span>
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/40"
                  style={{ width: topActivity ? `${(a.hours / topActivity) * 100}%` : 0 }}
                />
              </div>
              <span className="w-10 text-right font-semibold tabular-nums">{a.hours}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-[11px] tracking-wider text-muted-foreground uppercase">
            Monthly overview · sent and for-deployment updates
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {report.overview.length} distinct · max {OVERVIEW_WORD_LIMIT} words each
          </span>
        </div>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13px]">
          {report.overview.map((item) => (
            <li key={item.original}>
              {item.shortened ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-muted-foreground/40 decoration-dotted underline-offset-4">
                      {item.text}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">{item.original}</TooltipContent>
                </Tooltip>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ol>
      </div>
    </Card>
  )
}
