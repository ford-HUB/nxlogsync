import { useState } from 'react'
import { CircleAlert, CircleCheck, CircleMinus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ENDORSE_OUTCOME_LABEL, formatDayOfMonth } from '@/constants/sync-schedule'
import { formatDayLabel, fromDateKey, toDateKey } from '@/constants/time-format'
import { useAutoEndorse } from '@/hooks/use-auto-endorse'
import { useEndorseDays } from '@/hooks/use-endorse-days'
import type { EndorseDayResult } from '@/types/sync-schedule'
import { AutoEndorseNoticeDialog } from './ui/auto-endorse-notice-dialog'
import { AutoEndorseSettings } from './ui/auto-endorse-settings'
import { EndorseConfirmDialog } from './ui/endorse-confirm-dialog'

interface EndorseDaysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DOT =
  'after:pointer-events-none after:absolute after:bottom-0.5 after:left-1/2 after:size-2 after:-translate-x-1/2 after:rounded-full'

const CALENDAR_CLASS =
  'w-full! p-0 [--cell-size:--spacing(9)] **:[.rdp-day]:aspect-auto **:data-day:aspect-auto **:data-day:h-10'

/** Today gets no box of its own; the dots carry the day's state. */
const NO_TODAY = { today: '' }

const DAY_MODIFIERS = (dayState: ReturnType<typeof useEndorseDays>['dayState']) => ({
  synced: (day: Date) => dayState(toDateKey(day)) === 'synced',
  pending: (day: Date) => dayState(toDateKey(day)) === 'pending',
  endorsed: (day: Date) => dayState(toDateKey(day)) === 'endorsed',
})

const DAY_MODIFIER_CLASSES = {
  synced: `${DOT} after:bg-success`,
  pending: `${DOT} after:bg-warning`,
  endorsed: `${DOT} after:bg-muted-foreground`,
}

/** Pick synced days and endorse them to the checker on N-PAX, after a confirmation. */
export function EndorseDaysDialog({ open, onOpenChange }: EndorseDaysDialogProps) {
  const e = useEndorseDays(open)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const auto = useAutoEndorse(open)
  const autoDraft = auto.draft
  const [noticeOpen, setNoticeOpen] = useState(false)
  const today = fromDateKey(e.todayKey)
  // With auto-endorse on, the calendar picks the day of the month it runs on, shown in this month.
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const autoDay =
    autoDraft.dayOfMonth === null
      ? undefined
      : new Date(today.getFullYear(), today.getMonth(), Math.min(autoDraft.dayOfMonth, lastDay))

  const handleAutoToggle = (enabled: boolean) => {
    auto.setEnabled(enabled)
    if (enabled) e.setSelected([])
  }

  const handleAutoSave = async () => {
    if ((await auto.save()) && autoDraft.enabled) setNoticeOpen(true)
  }
  const count = e.selected.length
  const showResults = e.running || e.finished
  const done = Object.values(e.results).filter((r) => r.status === 'done' || r.status === 'failed').length

  // A run in progress can't be walked away from; it would be cut off mid-day.
  const handleOpenChange = (next: boolean) => {
    if (!e.running) onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full gap-3 sm:max-w-2xl" showCloseButton={!e.running}>
        <DialogHeader>
          <DialogTitle>Endorse days</DialogTitle>
          <DialogDescription className="text-[12px]">
            {showResults
              ? 'Endorsing each picked day on N-PAX in turn. Keep this open until every day is done.'
              : autoDraft.enabled
                ? 'Pick the day of the month auto-endorse runs on. On that day, every synced day that meets the 9-hour requirement is endorsed to your checker.'
                : 'Pick days already synced to N-PAX to endorse to your checker. Days still waiting for a sync, or already endorsed, can’t be picked.'}
          </DialogDescription>
        </DialogHeader>

        {showResults ? (
          <ul className="flex flex-col divide-y rounded-lg border text-[13px]">
            {Object.entries(e.results).map(([key, result]) => (
              <li key={key} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span>{formatDayLabel(key)}</span>
                <ResultLabel result={result} />
              </li>
            ))}
          </ul>
        ) : (
          <>
            {autoDraft.enabled ? (
              <Calendar
                key={`auto-${open}`}
                mode="single"
                required
                selected={autoDay}
                month={today}
                disableNavigation
                hideNavigation
                className={CALENDAR_CLASS}
                classNames={NO_TODAY}
                modifiers={DAY_MODIFIERS(e.dayState)}
                modifiersClassNames={DAY_MODIFIER_CLASSES}
                onSelect={(day) => auto.setDayOfMonth(day.getDate())}
              />
            ) : (
              <Calendar
                key={String(open)}
                mode="multiple"
                selected={e.selected.map(fromDateKey)}
                defaultMonth={today}
                endMonth={today}
                disabled={[{ after: today }, (day) => e.loading || e.dayState(toDateKey(day)) !== 'synced']}
                className={CALENDAR_CLASS}
                classNames={NO_TODAY}
                modifiers={DAY_MODIFIERS(e.dayState)}
                modifiersClassNames={DAY_MODIFIER_CLASSES}
                onSelect={(days) => e.setSelected((days ?? []).map(toDateKey).sort())}
              />
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                Synced · can be picked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-warning" />
                Waiting for sync
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground" />
                Already endorsed
              </span>
              {autoDraft.enabled ? (
                <span className="ml-auto text-foreground">
                  {autoDraft.dayOfMonth === null
                    ? 'No day picked yet'
                    : `Runs on the ${formatDayOfMonth(autoDraft.dayOfMonth)} of each month`}
                </span>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={e.toggleAll}
                  disabled={e.loading || e.syncedDays.length === 0}
                >
                  {e.allSelected ? 'Clear selection' : `Select all synced (${e.syncedDays.length})`}
                </Button>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          {e.running ? (
            <Button type="button" disabled>
              <Loader2 className="animate-spin" />
              Endorsing {Math.min(done + 1, count)} of {count}…
            </Button>
          ) : e.finished ? (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <AutoEndorseSettings
                draft={autoDraft}
                dirty={auto.dirty}
                loading={auto.loading}
                saving={auto.saving}
                error={auto.error}
                onToggle={handleAutoToggle}
                onSave={() => void handleAutoSave()}
              />
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={autoDraft.enabled || count === 0}
              >
                {count === 0 ? 'Endorse' : `Endorse ${count} ${count === 1 ? 'day' : 'days'}`}
              </Button>
            </>
          )}
        </DialogFooter>

        <EndorseConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          days={e.selected}
          dayMinutes={e.dayMinutes}
          onConfirm={() => void e.endorse()}
        />

        {auto.saved.dayOfMonth !== null && (
          <AutoEndorseNoticeDialog
            open={noticeOpen}
            onOpenChange={setNoticeOpen}
            dayOfMonth={auto.saved.dayOfMonth}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ResultLabel({ result }: { result: EndorseDayResult }) {
  switch (result.status) {
    case 'waiting':
      return <span className="text-muted-foreground">Waiting</span>
    case 'running':
      return (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Endorsing…
        </span>
      )
    case 'done':
      return result.outcome === 'endorsed' ? (
        <span className="flex items-center gap-1.5 text-success">
          <CircleCheck className="size-3.5" />
          {ENDORSE_OUTCOME_LABEL.endorsed}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-warning">
          <CircleMinus className="size-3.5" />
          {ENDORSE_OUTCOME_LABEL[result.outcome]}
        </span>
      )
    case 'failed':
      return (
        <span className="flex min-w-0 items-center gap-1.5 text-destructive" title={result.message}>
          <CircleAlert className="size-3.5 shrink-0" />
          <span className="truncate">{result.message}</span>
        </span>
      )
  }
}
