import { memo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ACTIVITY_LEVEL_CELL } from '@/constants/daily-log'
import { formatDayLabel, formatDuration } from '@/constants/time-format'
import { cn } from '@/lib/utils'
import type { ActivityLevel } from '@/types/daily-log'

interface ActivityCellProps {
  dateKey: string
  minutes: number
  entryCount: number
  level: ActivityLevel
  /** The day currently open in the log. */
  selected: boolean
  isToday: boolean
  onSelect: (key: string) => void
}

// Memoised: the heatmap renders ~370 of these and only one or two change per edit.
export const ActivityCell = memo(function ActivityCell({
  dateKey,
  minutes,
  entryCount,
  level,
  selected,
  isToday,
  onSelect,
}: ActivityCellProps) {
  const logged =
    entryCount > 0
      ? `${entryCount} ${entryCount === 1 ? 'entry' : 'entries'} · ${formatDuration(minutes)}`
      : 'Nothing logged'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          role="gridcell"
          aria-pressed={selected}
          aria-label={`${formatDayLabel(dateKey)}: ${logged}`}
          onClick={() => onSelect(dateKey)}
          className={cn(
            'size-3 cursor-pointer rounded-[3px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            ACTIVITY_LEVEL_CELL[level],
            !selected && isToday && 'ring-1 ring-foreground/40',
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="font-medium tabular-nums">{logged}</p>
        <p className="opacity-80">{formatDayLabel(dateKey)}</p>
      </TooltipContent>
    </Tooltip>
  )
})
