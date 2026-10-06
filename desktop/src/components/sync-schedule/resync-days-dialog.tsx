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
import { fromDateKey, toDateKey } from '@/constants/time-format'
import { useResyncDays } from '@/hooks/use-resync-days'

interface ResyncDaysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DOT =
  'after:pointer-events-none after:absolute after:bottom-0.5 after:left-1/2 after:size-2 after:-translate-x-1/2 after:rounded-full'

/** Pick synced days to mark for upload again; the next sync replaces them on N-PAX. */
export function ResyncDaysDialog({ open, onOpenChange }: ResyncDaysDialogProps) {
  const r = useResyncDays(open, () => onOpenChange(false))
  const today = fromDateKey(r.todayKey)
  const count = r.selected.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Resync days</DialogTitle>
          <DialogDescription className="text-[12px]">
            Pick days already on N-PAX to upload again, e.g. after editing their tasks. They are only marked here; the
            next sync replaces them on N-PAX.
          </DialogDescription>
        </DialogHeader>

        <Calendar
          key={String(open)}
          mode="multiple"
          selected={r.selected.map(fromDateKey)}
          defaultMonth={today}
          endMonth={today}
          disabled={[{ after: today }, (day) => r.loading || r.dayState(toDateKey(day)) !== 'synced']}
          className="w-full! p-0 [--cell-size:--spacing(9)] **:[.rdp-day]:aspect-auto **:data-day:aspect-auto **:data-day:h-10"
          modifiers={{
            synced: (day) => r.dayState(toDateKey(day)) === 'synced',
            pending: (day) => r.dayState(toDateKey(day)) === 'pending',
          }}
          modifiersClassNames={{
            synced: `${DOT} after:bg-success`,
            pending: `${DOT} after:bg-warning`,
          }}
          onSelect={(days) => r.setSelected((days ?? []).map(toDateKey).sort())}
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" />
            Synced · can be picked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" />
            Already waiting for sync
          </span>
          {r.error && (
            <span role="alert" className="text-destructive">
              {r.error}
            </span>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void r.submit()} disabled={count === 0 || r.saving}>
            {r.saving ? 'Marking…' : count === 0 ? 'Mark for resync' : `Mark ${count} ${count === 1 ? 'day' : 'days'} for resync`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
