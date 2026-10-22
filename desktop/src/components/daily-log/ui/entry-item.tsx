import { Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { workMinutes } from '@/constants/daily-log'
import { findJob } from '@/constants/jobs'
import { useJobsStore } from '@/store/jobs-store'
import { formatClock, formatDuration } from '@/constants/time-format'
import { findWorkActivity } from '@/constants/work-activities'
import type { EntryMove } from '@/lib/insert-entry'
import { cn } from '@/lib/utils'
import type { LogEntry } from '@/types/daily-log'

interface EntryItemProps {
  entry: LogEntry
  /** The day is endorsed on N-PAX: no editing, deleting or dragging to the Trash. */
  locked: boolean
  highlighted: boolean
  /** This row is loaded in the form for editing. */
  selected: boolean
  onHighlight: (id: string | null) => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  /** Picked up with a right-click drag, on its way to the recycle bin. */
  grabbed: boolean
  onGrab: (entry: LogEntry, x: number, y: number) => void
  /** The times this row moves to if the task being dragged lands (from the Trash) or swaps with it. */
  pendingMove?: EntryMove
  /** A task dragged over this row swaps places with it on release; false when it can't (it would pass midnight). */
  swapTarget?: { ok: boolean }
}

export function EntryItem({
  entry,
  locked,
  highlighted,
  selected,
  onHighlight,
  onSelect,
  onRemove,
  grabbed,
  onGrab,
  pendingMove,
  swapTarget,
}: EntryItemProps) {
  const minutes = workMinutes(entry.startMinutes, entry.endMinutes)
  const jobs = useJobsStore((s) => s.jobs)
  const job = findJob(jobs, entry.jobCode)
  const activity = findWorkActivity(entry.workActivityCode)

  return (
    <li
      data-entry-row
      data-entry-id={entry.id}
      onMouseEnter={() => onHighlight(entry.id)}
      onMouseLeave={() => onHighlight(null)}
      onMouseDown={(e) => {
        if (e.button === 2 && !locked) onGrab(entry, e.clientX, e.clientY)
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'group flex items-start rounded-lg transition-[background-color,opacity]',
        grabbed && 'opacity-40',
        swapTarget && (swapTarget.ok ? 'bg-orange-500/10 ring-2 ring-orange-500/60' : 'bg-destructive/5 ring-2 ring-destructive/60'),
        !swapTarget && (selected ? 'bg-primary/5 ring-1 ring-primary/20' : highlighted ? 'bg-muted' : 'hover:bg-muted/50'),
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${locked ? 'Endorsed' : 'Edit'} ${formatClock(entry.startMinutes)} – ${formatClock(entry.endMinutes)}: ${entry.description}`}
        disabled={locked}
        onClick={() => onSelect(entry.id)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col disabled:cursor-default gap-1 rounded-lg px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-row sm:gap-6"
      >
        {/* 268px + gap-6 = the form's picker group + gap-4, so descriptions share one column edge. */}
        <span className="flex h-6 shrink-0 items-center gap-2 sm:w-[268px]">
          {pendingMove ? (
            <span className="text-[13px] font-medium whitespace-nowrap text-orange-600 tabular-nums dark:text-orange-400">
              {formatClock(pendingMove.startMinutes)} – {formatClock(pendingMove.endMinutes)}
            </span>
          ) : (
            <span className="text-[13px] font-medium whitespace-nowrap tabular-nums">
              {formatClock(entry.startMinutes)} – {formatClock(entry.endMinutes)}
            </span>
          )}
          <Badge variant="secondary" className="tabular-nums">
            {formatDuration(minutes)}
          </Badge>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] leading-6 break-words whitespace-pre-wrap">{entry.description}</span>
          <span className="truncate text-[11px] text-muted-foreground">
            {job ? (
              <span className="tabular-nums">{job.code}</span>
            ) : (
              <span className="text-warning">No job</span>
            )}
            {' · '}
            {activity ? `${activity.code} ${activity.name}` : <span className="text-warning">No work activity</span>}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5 py-2.5 pr-3">
        <SyncStatus synced={entry.synced} edited={entry.editedSinceSync} endorsed={locked} />
        {!locked && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Edit entry"
              tabIndex={-1}
              onClick={() => onSelect(entry.id)}
              className={cn(
                '-my-0.5 cursor-pointer text-muted-foreground transition-opacity hover:text-foreground',
                selected ? 'text-foreground' : 'opacity-0 group-hover:opacity-100',
              )}
            >
              <Pencil />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete entry"
                  className="-my-0.5 -mr-1.5 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {formatClock(entry.startMinutes)} – {formatClock(entry.endMinutes)} ({formatDuration(minutes)}) will be
                    removed from this day&apos;s total.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={() => onRemove(entry.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </li>
  )
}

/** Where the entry stands with N-PAX: endorsed, uploaded, changed since it was, or not uploaded yet. */
function SyncStatus({ synced, edited, endorsed }: { synced: boolean; edited: boolean; endorsed: boolean }) {
  if (endorsed) return <span className="mr-2 text-[11px] whitespace-nowrap text-muted-foreground">Endorsed</span>
  if (synced) return <span className="mr-2 text-[11px] whitespace-nowrap text-success">Synced</span>
  if (edited) return <span className="mr-2 text-[11px] whitespace-nowrap text-warning">Edited · not synced</span>
  return <span className="mr-2 text-[11px] whitespace-nowrap text-muted-foreground">Not synced</span>
}
