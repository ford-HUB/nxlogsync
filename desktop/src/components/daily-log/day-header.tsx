import { CalendarDays, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDayLabel } from '@/constants/time-format'

interface DayHeaderProps {
  dateKey: string
  isToday: boolean
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onOpenActivity: () => void
  onOpenSettings: () => void
}

export function DayHeader({ dateKey, isToday, onPrevious, onNext, onToday, onOpenActivity, onOpenSettings }: DayHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Daily Log</h1>
        <p className="truncate text-[13px] text-muted-foreground">{formatDayLabel(dateKey)}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button type="button" variant="outline" size="icon" aria-label="Previous day" onClick={onPrevious}>
          <ChevronLeft />
        </Button>
        <Button type="button" variant="outline" onClick={onToday} disabled={isToday}>
          Today
        </Button>
        <Button type="button" variant="outline" size="icon" aria-label="Next day" onClick={onNext} disabled={isToday}>
          <ChevronRight />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="outline" onClick={onOpenActivity}>
          <CalendarDays />
          Activity
        </Button>
        <Button type="button" variant="outline" onClick={onOpenSettings}>
          <Settings />
          Settings
        </Button>
      </div>
    </header>
  )
}
