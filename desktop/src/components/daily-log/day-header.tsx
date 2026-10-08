import { useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, FileText, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toMonthKey } from '@/constants/reports'
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
  /** Opens the entries report on a month ("YYYY-MM"). */
  onOpenReport: (month: string) => void
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
  onOpenReport,
  locked = false,
}: DayHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  // The month the picker is showing, so the report opens on it.
  const [shownMonth, setShownMonth] = useState(toMonthKey(dateKey))
  const openPicker = () => {
    setShownMonth(toMonthKey(dateKey))
    setPickerOpen(true)
  }
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
        <Button type="button" variant="outline" onClick={openPicker} disabled={locked}>
          Today
        </Button>
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogContent className="w-full gap-3 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pick a day</DialogTitle>
              <DialogDescription className="text-[12px]">Dotted days have logged entries.</DialogDescription>
            </DialogHeader>
            {/* Remount on open so the grid starts on the month being viewed. */}
            <Calendar
              key={String(pickerOpen)}
              mode="single"
              required
              selected={selected}
              defaultMonth={selected}
              endMonth={today}
              disabled={{ after: today }}
              className="w-full! p-0 [--cell-size:--spacing(9)] **:[.rdp-day]:aspect-auto **:data-day:aspect-auto **:data-day:h-10"
              modifiers={{ logged: (day) => (minutesByDate[toDateKey(day)] ?? 0) > 0 }}
              modifiersClassNames={{
                logged:
                  'after:pointer-events-none after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-current after:opacity-60',
              }}
              onMonthChange={(month) => setShownMonth(toMonthKey(toDateKey(month)))}
              onSelect={(day) => pick(() => onSelectDay(toDateKey(day)))}
            />
            <div className="flex justify-between border-t pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => pick(() => onOpenReport(shownMonth))}>
                <FileText />
                Entries report
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => pick(onToday)} disabled={isToday}>
                Go to today
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
        <ThemeToggle />
      </div>
    </header>
  )
}
