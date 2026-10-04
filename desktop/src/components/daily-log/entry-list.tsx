import { ClipboardList } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LogEntry } from '@/types/daily-log'
import { ENTRY_SKELETON_ROWS } from '@/constants/daily-log'
import { EntryItem } from './ui/entry-item'
import { EntryListSkeleton } from './ui/entry-list-skeleton'

interface EntryListProps {
  entries: LogEntry[]
  /** False until the first load finishes; shows placeholder rows instead of the empty state. */
  initialized: boolean
  highlightedId: string | null
  editingId: string | null
  onHighlight: (id: string | null) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}

export function EntryList({ entries, initialized, highlightedId, editingId, onHighlight, onSelect, onRemove }: EntryListProps) {
  return (
    <Card aria-busy={!initialized} className="min-h-72 gap-0 py-0 shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle>Tasks</CardTitle>
        <CardDescription className="text-[12px]">In order of start time · click a task to edit it</CardDescription>
        {initialized && (
          <CardAction className="text-[12px] text-muted-foreground tabular-nums">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-1 py-2">
        {!initialized ? (
          <EntryListSkeleton rows={ENTRY_SKELETON_ROWS} />
        ) : entries.length === 0 ? (
          <EmptyEntries />
        ) : (
          <ul className="flex flex-col gap-0.5">
            {entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                highlighted={highlightedId === entry.id}
                selected={editingId === entry.id}
                onHighlight={onHighlight}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
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
