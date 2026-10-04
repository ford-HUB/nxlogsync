import { Badge } from '@/components/ui/badge'
import { formatRunTime, RUN_STATUS_BADGE, RUN_STATUS_DOT, RUN_STATUS_LABEL, RUN_TRIGGER_LABEL } from '@/constants/sync-schedule'
import { formatDuration } from '@/constants/time-format'
import { cn } from '@/lib/utils'
import type { SyncRun } from '@/types/sync-schedule'

interface RunItemProps {
  run: SyncRun
  now: Date
}

export function RunItem({ run, now }: RunItemProps) {
  const detail =
    run.message ??
    (run.status === 'running'
      ? 'Uploading entries…'
      : `${run.entryCount} ${run.entryCount === 1 ? 'entry' : 'entries'} · ${formatDuration(run.minutes)}`)

  return (
    <li className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
      <span className={cn('mt-[7px] size-2 shrink-0 rounded-full', RUN_STATUS_DOT[run.status])} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium tabular-nums">{formatRunTime(run.startedAt, now)}</span>
          <Badge className={RUN_STATUS_BADGE[run.status]}>{RUN_STATUS_LABEL[run.status]}</Badge>
        </div>
        <p className={cn('truncate text-[12px] text-muted-foreground', run.status === 'failed' && 'text-destructive')}>
          {RUN_TRIGGER_LABEL[run.trigger]} · {detail}
        </p>
      </div>
    </li>
  )
}
