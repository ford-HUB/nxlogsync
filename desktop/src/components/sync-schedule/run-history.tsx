import { History } from 'lucide-react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { SyncRun } from '@/types/sync-schedule'
import { RunItem } from './ui/run-item'

interface RunHistoryProps {
  runs: SyncRun[]
  now: Date
}

export function RunHistory({ runs, now }: RunHistoryProps) {
  return (
    <Card className="min-h-64 gap-0 py-0 shadow-sm lg:flex-1">
      <CardHeader className="border-b py-4">
        <CardTitle>Recent syncs</CardTitle>
        <CardDescription className="text-[12px]">Newest first</CardDescription>
        <CardAction className="text-[12px] text-muted-foreground tabular-nums">
          {runs.length} {runs.length === 1 ? 'run' : 'runs'}
        </CardAction>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto px-1 py-2">
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
            {runs.map((run) => (
              <RunItem key={run.id} run={run} now={now} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
