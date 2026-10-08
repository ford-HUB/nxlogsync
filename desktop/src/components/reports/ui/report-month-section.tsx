import { formatHours } from '@/constants/reports'
import type { ReportMonth } from '@/types/reports'

interface ReportMonthSectionProps {
  month: ReportMonth
}

/** One month of the report preview: a heading with its total, then one row per entry. */
export function ReportMonthSection({ month }: ReportMonthSectionProps) {
  const count = month.entries.length

  return (
    <section className="flex flex-col">
      <div className="sticky top-0 z-10 flex items-baseline justify-between rounded-md bg-foreground px-3 py-1.5 text-background">
        <h3 className="text-[13px] font-semibold">{month.label}</h3>
        <span className="text-[11px] tabular-nums opacity-80">
          {count} {count === 1 ? 'entry' : 'entries'} · {formatHours(month.totalMinutes)}
        </span>
      </div>

      {count === 0 ? (
        <p className="px-3 py-3 text-[12px] text-muted-foreground">No entries logged this month.</p>
      ) : (
        <ul className="flex flex-col">
          {month.entries.map((entry) => (
            <li
              key={entry.id}
              className="grid grid-cols-[88px_minmax(0,180px)_minmax(0,1fr)_72px] gap-3 border-b px-3 py-2 text-[12.5px] last:border-b-0"
            >
              <span className="text-muted-foreground tabular-nums">{entry.date}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium" title={entry.jobName}>
                  {entry.jobName}
                </span>
                {entry.jobCode && entry.jobCode !== entry.jobName && (
                  <span className="block truncate text-[11px] text-muted-foreground">{entry.jobCode}</span>
                )}
              </span>
              <span className="min-w-0 break-words">{entry.description}</span>
              <span className="text-right tabular-nums">{formatHours(entry.minutes)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between border-t border-foreground/60 px-3 py-1.5 text-[12px] font-semibold">
        <span>Total for {month.label}</span>
        <span className="tabular-nums">{formatHours(month.totalMinutes)}</span>
      </div>
    </section>
  )
}
