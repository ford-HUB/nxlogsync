import { ArrowDownToLine, ClipboardList, Coffee } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LogEntry } from '@/types/daily-log'
import { ENTRY_SKELETON_ROWS, workMinutes } from '@/constants/daily-log'
import { formatClock, formatDuration, fromDateKey, isWeekendKey } from '@/constants/time-format'
import type { InsertPlan } from '@/lib/insert-entry'
import { cn } from '@/lib/utils'
import { EntryItem } from './ui/entry-item'
import { EntryListSkeleton } from './ui/entry-list-skeleton'

interface EntryListProps {
  dateKey: string
  entries: LogEntry[]
  /** False until the first load finishes; shows placeholder rows instead of the empty state. */
  initialized: boolean
  highlightedId: string | null
  editingId: string | null
  onHighlight: (id: string | null) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  grabbedId: string | null
  onGrab: (entry: LogEntry, x: number, y: number) => void
  /** A task dragged in from the Trash: the slot it would land in, and its plan (null when it doesn't fit). */
  drop: { index: number; plan: InsertPlan | null } | null
}

export function EntryList({
  dateKey,
  entries,
  initialized,
  highlightedId,
  editingId,
  onHighlight,
  onSelect,
  onRemove,
  grabbedId,
  onGrab,
  drop,
}: EntryListProps) {
  const marker = drop && <DropMarker key="drop-marker" plan={drop.plan} />
  return (
    <Card aria-busy={!initialized} className="min-h-72 gap-0 py-0 shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle>Tasks</CardTitle>
        <CardDescription className="text-[12px]">In order of start time · click a task to edit it · right-click drag it to the Trash to set it aside</CardDescription>
        {initialized && (
          <CardAction className="text-[12px] text-muted-foreground tabular-nums">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-1 py-2">
        {!initialized ? (
          <EntryListSkeleton rows={ENTRY_SKELETON_ROWS} />
        ) : entries.length === 0 && !drop ? (
          isWeekendKey(dateKey) ? <WeekendRest dateKey={dateKey} /> : <EmptyEntries />
        ) : (
          <ul className="flex flex-col gap-0.5">
            {entries.flatMap((entry, i) => [
              i === drop?.index ? marker : null,
              <EntryItem
                key={entry.id}
                entry={entry}
                highlighted={highlightedId === entry.id}
                selected={editingId === entry.id}
                onHighlight={onHighlight}
                onSelect={onSelect}
                onRemove={onRemove}
                grabbed={grabbedId === entry.id}
                onGrab={onGrab}
                pendingMove={drop?.plan?.moves.find((m) => m.id === entry.id)}
              />,
            ])}
            {drop && drop.index >= entries.length && marker}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Where a task dragged in from the Trash will land, with the times it gets. */
function DropMarker({ plan }: { plan: InsertPlan | null }) {
  return (
    <li
      aria-live="polite"
      className={cn(
        'mx-2 my-1 flex items-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-[12px]',
        plan ? 'border-orange-500/70 bg-orange-500/10' : 'border-destructive/60 bg-destructive/5 text-destructive',
      )}
    >
      <ArrowDownToLine className="size-3.5 shrink-0" />
      {plan ? (
        <span className="tabular-nums">
          Lands at{' '}
          <span className="font-medium">
            {formatClock(plan.startMinutes)} – {formatClock(plan.endMinutes)}
          </span>{' '}
          ({formatDuration(workMinutes(plan.startMinutes, plan.endMinutes))})
          {plan.moves.length > 0 && (
            <span className="text-muted-foreground">
              {' '}
              · moves {plan.moves.length} {plan.moves.length === 1 ? 'task' : 'tasks'} below later
            </span>
          )}
        </span>
      ) : (
        <span>Doesn&apos;t fit here: the tasks below would run past midnight.</span>
      )}
    </li>
  )
}

function EmptyEntries() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <ClipboardList className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Nothing logged for this day</p>
      <p className="max-w-xs text-[12px] text-muted-foreground">
        Pick a start and finish time, describe the task, and add it to start building the day&apos;s total.
      </p>
    </div>
  )
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

function WeekendRest({ dateKey }: { dateKey: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Coffee className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">It&apos;s {WEEKDAY_FORMAT.format(fromDateKey(dateKey))}, give yourself some rest, sir.</p>
      <p className="max-w-xs text-[12px] text-muted-foreground">Weekends are off. Tasks can be logged again on Monday.</p>
    </div>
  )
}
