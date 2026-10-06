import { useState } from 'react'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RUN_HISTORY_PAGE_SIZE } from '@/constants/sync-schedule'
import type { SyncRun } from '@/types/sync-schedule'
import { RunItem } from './ui/run-item'

interface RunHistoryProps {
  runs: SyncRun[]
  now: Date
}

export function RunHistory({ runs, now }: RunHistoryProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleRuns = expanded ? runs : runs.slice(0, RUN_HISTORY_PAGE_SIZE)
  const hiddenCount = runs.length - visibleRuns.length
  const canCollapse = expanded && runs.length > RUN_HISTORY_PAGE_SIZE

  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle>Recent syncs</CardTitle>
        <CardDescription className="text-[12px]">Newest first</CardDescription>
        <CardAction className="text-[12px] text-muted-foreground tabular-nums">
          {runs.length} {runs.length === 1 ? 'run' : 'runs'}
        </CardAction>
      </CardHeader>
      <CardContent className="px-1 py-2">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <History className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No syncs yet</p>
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
