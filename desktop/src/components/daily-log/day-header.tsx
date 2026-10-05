import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDayLabel, fromDateKey, toDateKey } from '@/constants/time-format'

interface DayHeaderProps {
  dateKey: string
  todayKey: string
  isToday: boolean
  /** Logged minutes per date key; days with any are marked in the month picker. */
  minutesByDate: Record<string, number>
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onSelectDay: (key: string) => void
  onOpenActivity: () => void
  onOpenSettings: () => void
  /** Disables everything except Settings (no site user signed in yet). */
  locked?: boolean
}

export function DayHeader({
  dateKey,
  todayKey,
  isToday,
  minutesByDate,
  onPrevious,
  onNext,
  onToday,
  onSelectDay,
  onOpenActivity,
  onOpenSettings,
  locked = false,
}: DayHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const today = fromDateKey(todayKey)
  const selected = fromDateKey(dateKey)
  const pick = (go: () => void) => {
    go()
    setPickerOpen(false)
  }

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Daily Log</h1>
        <p className="truncate text-[13px] text-muted-foreground">{formatDayLabel(dateKey)}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button type="button" variant="outline" size="icon" aria-label="Previous day" onClick={onPrevious} disabled={locked}>
          <ChevronLeft />
        </Button>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" disabled={locked}>
              Today
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            {/* Remount on open so the grid starts on the month being viewed. */}
            <Calendar
              key={String(pickerOpen)}
              mode="single"
              required
              selected={selected}
              defaultMonth={selected}
              endMonth={today}
              disabled={{ after: today }}
              modifiers={{ logged: (day) => (minutesByDate[toDateKey(day)] ?? 0) > 0 }}
              modifiersClassNames={{
                logged:
                  'after:pointer-events-none after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current after:opacity-60',
              }}
              onSelect={(day) => pick(() => onSelectDay(toDateKey(day)))}
            />
            <div className="flex justify-end border-t p-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => pick(onToday)} disabled={isToday}>
                Go to today
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" size="icon" aria-label="Next day" onClick={onNext} disabled={isToday || locked}>
          <ChevronRight />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        <Button type="button" variant="outline" onClick={onOpenActivity} disabled={locked}>
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
