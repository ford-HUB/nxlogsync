import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  formatRunTime,
  formatUntil,
  RUN_STATUS_DOT,
  RUN_STATUS_LABEL,
  SCHEDULE_STATE_BADGE,
  SCHEDULE_STATE_LABEL,
} from '@/constants/sync-schedule'
import { formatDuration } from '@/constants/time-format'
import type { SyncScheduleState } from '@/hooks/use-sync-schedule'
import { cn } from '@/lib/utils'

interface SyncStatusSummaryProps {
  schedule: SyncScheduleState
}

export function SyncStatusSummary({ schedule: s }: SyncStatusSummaryProps) {
  const { nextRun, lastRun, pending, now } = s
  const minutesUntil = nextRun ? Math.max(1, Math.round((nextRun.getTime() - now.getTime()) / 60_000)) : 0

  return (
    <Card className="shrink-0 gap-0 pb-0 shadow-sm">
      <CardContent className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] tracking-wider text-muted-foreground uppercase">Next sync</span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl leading-8 font-semibold tabular-nums">
              {nextRun ? formatRunTime(nextRun, now) : 'Not scheduled'}
            </span>
            {nextRun && (
              <span className="text-sm text-muted-foreground tabular-nums">in {formatUntil(minutesUntil)}</span>
            )}
            <Badge className={cn('ml-1', SCHEDULE_STATE_BADGE[s.state])}>{SCHEDULE_STATE_LABEL[s.state]}</Badge>
            {s.isDirty && (
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Unsaved
              </Badge>
            )}
          </div>
        </div>

        <dl className="flex gap-6 sm:gap-8">
          <Stat label="Last sync">
            {lastRun ? (
              <span className="flex items-center gap-2">
                <span
                  aria-label={RUN_STATUS_LABEL[lastRun.status]}
                  className={cn('size-2 shrink-0 rounded-full', RUN_STATUS_DOT[lastRun.status])}
                />
                {formatRunTime(lastRun.startedAt, now)}
              </span>
            ) : (
              '—'
            )}
          </Stat>
          <div className="w-px self-stretch bg-border" />
          <Stat label="Waiting to upload">
            {pending.minutes === 0 ? (
              'Up to date'
            ) : (
              <>
                {formatDuration(pending.minutes)}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  · {pending.days} {pending.days === 1 ? 'day' : 'days'}
                </span>
              </>
            )}
          </Stat>
          <div className="hidden w-px self-stretch bg-border md:block" />
          <Stat label="Uploaded" className="hidden md:flex">
            {s.successCount}
            <span className="ml-1 text-sm font-normal text-muted-foreground">of {s.finishedCount} runs</span>
          </Stat>
        </dl>
      </CardContent>

      <CardFooter className="justify-between gap-3 py-3">
        <div className="flex items-center gap-2.5">
          <Switch
            id="auto-sync"
            checked={s.draft.enabled}
            disabled={s.draft.mode === 'manual' || s.saving}
            onCheckedChange={s.setEnabled}
          />
          <Label htmlFor="auto-sync" className="text-[13px] font-normal">
            Automatic sync
            <span className="text-muted-foreground">
              {s.draft.mode === 'manual' ? ' · off in manual mode' : s.draft.enabled ? '' : ' · paused'}
            </span>
          </Label>
        </div>
        <Button type="button" onClick={s.syncNow} disabled={s.isSyncing}>
          <RefreshCw className={cn(s.isSyncing && 'animate-spin')} />
          {s.isSyncing ? 'Syncing…' : 'Sync now'}
        </Button>
      </CardFooter>
    </Card>
  )
}

interface StatProps {
  label: string
  children: ReactNode
  className?: string
}

function Stat({ label, children, className }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <dt className="text-[11px] tracking-wider whitespace-nowrap text-muted-foreground uppercase">{label}</dt>
      <dd className="flex items-baseline text-lg leading-8 font-semibold whitespace-nowrap tabular-nums">{children}</dd>
    </div>
  )
}
