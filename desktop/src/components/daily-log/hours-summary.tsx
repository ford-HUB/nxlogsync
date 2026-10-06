import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DAILY_LIMIT_HOURS,
  DAILY_LIMIT_MINUTES,
  DAY_STATUS_BADGE,
  DAY_STATUS_BAR,
  DAY_STATUS_LABEL,
  workMinutes,
} from '@/constants/daily-log'
import { formatClock, formatDuration } from '@/constants/time-format'
import { cn } from '@/lib/utils'
import type { DayStatus, LogEntry } from '@/types/daily-log'

interface HoursSummaryProps {
  entries: LogEntry[]
  totalMinutes: number
  remainingMinutes: number
  overtimeMinutes: number
  status: DayStatus
  highlightedId: string | null
  onHighlight: (id: string | null) => void
}

const HOUR_TICKS = Array.from({ length: DAILY_LIMIT_HOURS + 1 }, (_, i) => i)

export function HoursSummary({
  entries,
  totalMinutes,
  remainingMinutes,
  overtimeMinutes,
  status,
  highlightedId,
  onHighlight,
}: HoursSummaryProps) {
  const scale = Math.max(DAILY_LIMIT_MINUTES, totalMinutes)
  const percent = Math.round((totalMinutes / DAILY_LIMIT_MINUTES) * 100)
  /** Where 9h sits on the bar; short of 100% only when the day runs over. */
  const limitPercent = (DAILY_LIMIT_MINUTES / scale) * 100
  // Minutes logged before each entry, to find the one the limit falls inside.
  let loggedBefore = 0
  const span =
    entries.length > 0
      ? `${formatClock(entries[0].startMinutes)} – ${formatClock(entries[entries.length - 1].endMinutes)}`
      : '—'

  return (
    <Card className="shrink-0 gap-4 shadow-sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Total hours</span>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-2xl leading-8 font-semibold tabular-nums">
                {formatDuration(totalMinutes)}
              </span>
              <span className="text-sm text-muted-foreground tabular-nums">
                of {DAILY_LIMIT_HOURS}h · {percent}%
              </span>
              <Badge className={cn('ml-1', DAY_STATUS_BADGE[status])}>{DAY_STATUS_LABEL[status]}</Badge>
            </div>
          </div>

          <dl className="flex gap-6 sm:gap-8">
            {overtimeMinutes > 0 ? (
              <Stat label="Overtime" value={`+${formatDuration(overtimeMinutes)}`} className="*:last:text-destructive" />
            ) : (
              <Stat label="Remaining" value={formatDuration(remainingMinutes)} />
            )}
            <div className="w-px self-stretch bg-border" />
            <Stat label="Entries" value={String(entries.length)} />
            <div className="hidden w-px self-stretch bg-border md:block" />
            <Stat label="Span" value={span} className="hidden md:flex" />
          </dl>
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            className="relative flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`${formatDuration(totalMinutes)} logged of ${DAILY_LIMIT_HOURS} hour limit${overtimeMinutes > 0 ? `, ${formatDuration(overtimeMinutes)} overtime` : ''}`}
          >
            {entries.map((entry) => {
              const minutes = workMinutes(entry.startMinutes, entry.endMinutes)
              const dimmed = highlightedId !== null && highlightedId !== entry.id
              // Overtime: the part of the day past 9h is red, splitting the entry it starts in.
              const withinLimit = Math.min(minutes, Math.max(0, DAILY_LIMIT_MINUTES - loggedBefore))
              loggedBefore += minutes
              const overtimeClass = overtimeMinutes > 0 && withinLimit === 0 && 'bg-destructive'
              const splitAt = overtimeMinutes > 0 && withinLimit > 0 && withinLimit < minutes
                ? (withinLimit / minutes) * 100
                : null
              return (
                <Tooltip key={entry.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={entry.description}
                      onMouseEnter={() => onHighlight(entry.id)}
                      onMouseLeave={() => onHighlight(null)}
                      onFocus={() => onHighlight(entry.id)}
                      onBlur={() => onHighlight(null)}
                      className={cn(
                        'h-full transition-opacity first:rounded-l-full last:rounded-r-full focus-visible:outline-none',
                        overtimeClass || DAY_STATUS_BAR[status],
                        dimmed && 'opacity-30',
                      )}
                      style={{
                        width: `${(minutes / scale) * 100}%`,
                        backgroundImage:
                          splitAt === null
                            ? undefined
                            : `linear-gradient(to right, var(--success) ${splitAt}%, var(--destructive) ${splitAt}%)`,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    <p className="font-medium tabular-nums">
                      {formatClock(entry.startMinutes)} – {formatClock(entry.endMinutes)} · {formatDuration(minutes)}
                    </p>
                    <p className="line-clamp-2 opacity-80">{entry.description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
          <div className="flex text-[10px] text-muted-foreground tabular-nums">
            {/* Ticks span 0–9h only, so they stay lined up when overtime stretches the bar. */}
            <div className="flex shrink-0 justify-between" style={{ width: `${limitPercent}%` }}>
              {HOUR_TICKS.map((hour) => (
                <span key={hour} className={cn(hour % 3 !== 0 && 'hidden sm:inline')}>
                  {hour}h
                </span>
              ))}
            </div>
            {overtimeMinutes > 0 && (
              <span className="ml-auto pl-2 font-medium whitespace-nowrap text-destructive">
                +{formatDuration(overtimeMinutes)} overtime
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</dt>
      <dd className="text-lg leading-8 font-semibold whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  )
}
