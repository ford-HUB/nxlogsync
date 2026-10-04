import { useLayoutEffect, useRef } from 'react'
import {
  ACTIVITY_LEVEL_CELL,
  ACTIVITY_LEVEL_LABEL,
  ACTIVITY_SCALE,
  ACTIVITY_WEEKDAY_LABELS,
  DAILY_LIMIT_MINUTES,
} from '@/constants/daily-log'
import { useActivityWeeks } from '@/hooks/use-activity-weeks'
import { cn } from '@/lib/utils'
import type { ActivityLevel } from '@/types/daily-log'
import { ActivityCell } from './ui/activity-cell'

interface ActivityHeatmapProps {
  todayKey: string
  selectedKey: string
  minutesByDate: Record<string, number>
  onSelectDay: (key: string) => void
}

function getActivityLevel(minutes: number): ActivityLevel {
  if (minutes <= 0) return 'none'
  if (minutes > DAILY_LIMIT_MINUTES) return 'over'
  if (minutes === DAILY_LIMIT_MINUTES) return 'full'
  if (minutes >= 6 * 60) return 'high'
  if (minutes >= 3 * 60) return 'medium'
  return 'low'
}

export function ActivityHeatmap({ todayKey, selectedKey, minutesByDate, onSelectDay }: ActivityHeatmapProps) {
  const weeks = useActivityWeeks(todayKey)
  const scrollRef = useRef<HTMLDivElement>(null)

  // On narrow windows the grid scrolls sideways; start at the newest week, like GitHub.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div ref={scrollRef} className="overflow-x-auto rounded-lg border p-3">
        <div className="flex w-max gap-[3px]">
          {/* Weekday gutter; the empty first cell lines up with the month row. */}
          <div className="mr-1 flex flex-col gap-[3px] text-[10px] leading-3 text-muted-foreground">
            <span className="h-3" />
            {ACTIVITY_WEEKDAY_LABELS.map((label, i) => (
              <span key={i} className="h-3">
                {label}
              </span>
            ))}
          </div>

          <div role="grid" aria-label="Hours logged per day over the last year" className="flex gap-[3px]">
            {weeks.map((week) => (
              <div key={week.days[0] ?? week.monthLabel} role="row" className="flex flex-col gap-[3px]">
                {/* Month label overflows to the right, across the next weeks' columns. */}
                <span className="h-3 w-3 overflow-visible text-[10px] leading-3 whitespace-nowrap text-muted-foreground">
                  {week.monthLabel}
                </span>
                {week.days.map((key, day) =>
                  key ? (
                    <ActivityCell
                      key={key}
                      dateKey={key}
                      minutes={minutesByDate[key] ?? 0}
                      level={getActivityLevel(minutesByDate[key] ?? 0)}
                      selected={key === selectedKey}
                      isToday={key === todayKey}
                      onSelect={onSelectDay}
                    />
                  ) : (
                    <span key={day} role="gridcell" aria-hidden className="size-3" />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span>Click a day to open it in the log</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="mr-0.5">Less</span>
            {ACTIVITY_SCALE.map((level) => (
              <LegendSwatch key={level} level={level} />
            ))}
            <span className="ml-0.5">More</span>
          </div>
          <div className="flex items-center gap-1">
            <LegendSwatch level="over" />
            <span>Over limit</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendSwatch({ level }: { level: ActivityLevel }) {
  return (
    <span aria-label={ACTIVITY_LEVEL_LABEL[level]} className={cn('size-3 rounded-[3px]', ACTIVITY_LEVEL_CELL[level])} />
  )
}
