import { Card } from '@/components/ui/card'
import { IMPORT_STATUS_DOT, IMPORT_STATUS_LABEL, IMPORT_STATUS_ORDER } from '@/constants/excel-report'
import { cn } from '@/lib/utils'
import type { ImportedRow, ImportRowStatus } from '@/types/excel-report'

interface ImportSummaryProps {
  rows: ImportedRow[]
  filter: ImportRowStatus | null
  onFilter: (status: ImportRowStatus | null) => void
}

/** Usable hours up front, then the rows split by status; a status filters the table below. */
export function ImportSummary({ rows, filter, onFilter }: ImportSummaryProps) {
  const counts = Object.fromEntries(
    IMPORT_STATUS_ORDER.map((s) => [s, rows.filter((r) => r.status === s).length]),
  ) as Record<ImportRowStatus, number>
  const usableHours = rows.filter((r) => r.status !== 'error').reduce((sum, r) => sum + (r.hours ?? 0), 0)
  const total = rows.length

  return (
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex shrink-0 flex-col">
        <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Hours to report</span>
        <span className="text-2xl font-semibold tabular-nums">{usableHours}</span>
      </div>
      <div className="hidden w-px self-stretch bg-border lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {total > 0 &&
            IMPORT_STATUS_ORDER.map((s) => (
              <div
                key={s}
                style={{ width: `${(counts[s] / total) * 100}%` }}
                className={cn(IMPORT_STATUS_DOT[s], 'transition-opacity', filter && filter !== s && 'opacity-30')}
              />
            ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {IMPORT_STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filter === s}
              onClick={() => onFilter(filter === s ? null : s)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                filter === s && 'bg-muted',
                filter && filter !== s && 'opacity-50',
              )}
            >
              <span className={cn('size-2 rounded-full', IMPORT_STATUS_DOT[s])} />
              {IMPORT_STATUS_LABEL[s]}
              <span className="font-semibold tabular-nums">{counts[s]}</span>
              <span className="text-muted-foreground tabular-nums">of {total}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
