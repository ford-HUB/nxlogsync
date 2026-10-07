import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { DAILY_LIMIT_MINUTES } from '@/constants/daily-log'
import { formatDayLabel, formatDuration } from '@/constants/time-format'
import { cn } from '@/lib/utils'

interface EndorseConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  days: string[]
  dayMinutes: (key: string) => number
  onConfirm: () => void
}

/**
 * The last stop before endorsing: lists every picked day with its hours and
 * only lets Endorse through once the user ticks that they checked them all.
 */
export function EndorseConfirmDialog({ open, onOpenChange, days, dayMinutes, onConfirm }: EndorseConfirmDialogProps) {
  const [checked, setChecked] = useState(false)
  const count = days.length

  // Every opening asks again.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setChecked(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-destructive" />
            Endorse {count} {count === 1 ? 'day' : 'days'} to your checker?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">
            Endorsing can’t be undone. Once endorsed, a day can no longer be edited, resynced or cleared on N-PAX.
            Make sure every entry below is correct first.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="flex max-h-48 flex-col divide-y overflow-y-auto rounded-lg border text-[13px]">
          {days.map((key) => {
            const minutes = dayMinutes(key)
            const note =
              minutes < DAILY_LIMIT_MINUTES ? 'Under 9h · will be skipped' : minutes > DAILY_LIMIT_MINUTES ? 'Overtime' : null
            return (
              <li key={key} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>{formatDayLabel(key)}</span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  {note && (
                    <span className={cn('text-[11px]', minutes < DAILY_LIMIT_MINUTES ? 'text-warning' : 'text-muted-foreground')}>
                      {note}
                    </span>
                  )}
                  <span className="font-medium">{formatDuration(minutes)}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="flex items-start gap-2.5">
          <Checkbox id="endorse-confirm" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <Label htmlFor="endorse-confirm" className="text-[13px] leading-snug font-normal">
            I’ve checked every entry on {count === 1 ? 'this day' : `these ${count} days`} and they are ready for my checker.
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Go back</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={!checked} onClick={onConfirm}>
            Endorse {count} {count === 1 ? 'day' : 'days'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
