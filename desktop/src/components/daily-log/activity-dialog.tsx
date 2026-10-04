import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useActivityTotals } from '@/hooks/use-activity-weeks'
import { ActivityHeatmap } from './activity-heatmap'

interface ActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  todayKey: string
  selectedKey: string
  minutesByDate: Record<string, number>
  onSelectDay: (key: string) => void
}

export function ActivityDialog({
  open,
  onOpenChange,
  todayKey,
  selectedKey,
  minutesByDate,
  onSelectDay,
}: ActivityDialogProps) {
  const { totalMinutes, daysLogged } = useActivityTotals(todayKey, minutesByDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-4 sm:max-w-[54rem]"
        // Radix focuses the first cell by default, which pops its tooltip on open.
        // Focus the dialog itself so a day's tooltip only shows on hover.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.target as HTMLElement).focus()
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {Math.round(totalMinutes / 60).toLocaleString()}h
            </span>
            <span className="text-base font-medium">logged in the last year</span>
          </DialogTitle>
          <DialogDescription className="text-[12px] tabular-nums">{daysLogged} days with entries</DialogDescription>
        </DialogHeader>

        <ActivityHeatmap
          todayKey={todayKey}
          selectedKey={selectedKey}
          minutesByDate={minutesByDate}
          onSelectDay={onSelectDay}
        />
      </DialogContent>
    </Dialog>
  )
}
