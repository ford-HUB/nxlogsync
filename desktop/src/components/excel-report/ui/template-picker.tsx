import { Check, FileSpreadsheet } from 'lucide-react'
import { REPORT_KINDS, REPORT_TEMPLATES } from '@/constants/excel-report'
import { cn } from '@/lib/utils'
import type { ReportKind } from '@/types/excel-report'

interface TemplatePickerProps {
  value: ReportKind | null
  onChange: (kind: ReportKind) => void
}

/**
 * The two built-in pre-templates, side by side: the client, the job codes it extracts from the
 * manhour file, and the monthly plan. Picking one sets the report type.
 */
export function TemplatePicker({ value, onChange }: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {REPORT_KINDS.map((kind) => {
        const selected = value === kind
        const { client, jobs, planHours, pages } = REPORT_TEMPLATES[kind]
        return (
          <button
            key={kind}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(kind)}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring',
              selected && 'border-primary bg-primary/5 hover:bg-primary/5',
            )}
          >
            <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{kind} Monthly Maintenance Report</span>
                <span className="truncate text-[12px] text-muted-foreground">{client}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {jobs.map((job) => (
                  <span key={job.code} className="truncate text-[12px]">
                    <span className="font-mono text-[11px] text-muted-foreground">{job.code}</span> {job.name}
                  </span>
                ))}
              </div>
              <span className="truncate text-[11px] text-muted-foreground">
                Plan <span className="tabular-nums">{planHours}</span> h / month · {pages.length} pages
              </span>
            </div>
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border',
                selected && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              {selected && <Check className="size-3" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}
