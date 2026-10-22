import { useState } from 'react'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RUN_HISTORY_PAGE_SIZE } from '@/constants/sync-schedule'
import type { SyncRun } from '@/types/sync-schedule'
import { RunItem } from './ui/run-item'

interface RunHistoryProps {
  runs: SyncRun[]
  now: Date
  /** Soft clear: the runs leave this list but stay on the server. */
  onClear: () => Promise<void>
}

export function RunHistory({ runs, now, onClear }: RunHistoryProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleRuns = expanded ? runs : runs.slice(0, RUN_HISTORY_PAGE_SIZE)
  const hiddenCount = runs.length - visibleRuns.length
  const canCollapse = expanded && runs.length > RUN_HISTORY_PAGE_SIZE
  // A run still uploading can't be cleared, so offer Clear only when something finished.
  const clearable = runs.filter((r) => r.status !== 'running').length

  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle>Recent syncs</CardTitle>
        <CardDescription className="text-[12px]">Newest first</CardDescription>
        <CardAction className="flex items-center gap-2 text-[12px] text-muted-foreground tabular-nums">
          {runs.length} {runs.length === 1 ? 'run' : 'runs'}
          {clearable > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="-my-1 -mr-2 h-7 px-2 text-[12px] text-muted-foreground">
                  Clear
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear recent syncs?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Removes{' '}
                    <strong className="font-semibold text-foreground">
                      {clearable} {clearable === 1 ? 'run' : 'runs'}
                    </strong>{' '}
                    from this list. Your uploaded entries aren't affected, and the history is kept on record.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void onClear().then(() => setExpanded(false))}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-1 py-2">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <History className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No recent syncs</p>
            <p className="max-w-xs text-[12px] text-muted-foreground">Runs appear here once the schedule fires or you sync manually.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {visibleRuns.map((run) => (
              <RunItem key={run.id} run={run} now={now} />
            ))}
          </ul>
        )}
      </CardContent>
      {(hiddenCount > 0 || canCollapse) && (
        <CardFooter className="border-t px-2 py-1.5">
          {hiddenCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[12px] text-muted-foreground"
              onClick={() => setExpanded(true)}
            >
              <ChevronDown />
              Show all <span className="tabular-nums">({hiddenCount} more)</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[12px] text-muted-foreground"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp />
              Show less
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
