import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatClock } from '@/constants/time-format'

interface TaskTimerProps {
  running: boolean
  startedAt: Date | null
  elapsedMs: number
  onStart: () => void
  onStop: () => void
  /** Why Stop can't be pressed right now (e.g. an entry is being edited). */
  stopBlockedReason?: string
}

/** 3_725_000 → "1:02:05" */
function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/** Start/Stop stopwatch: Start begins timing the task, Stop fills in its times. */
export function TaskTimer({ running, startedAt, elapsedMs, onStart, onStop, stopBlockedReason }: TaskTimerProps) {
  if (!running || !startedAt) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={onStart}>
        <Play />
        Start
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2.5" role="timer" aria-live="off">
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <span aria-hidden className="size-2 animate-pulse rounded-full bg-destructive" />
        Since {formatClock(startedAt.getHours() * 60 + startedAt.getMinutes())}
      </span>
      <span className="text-sm font-semibold tabular-nums">{formatElapsed(elapsedMs)}</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={onStop}
        disabled={Boolean(stopBlockedReason)}
        title={stopBlockedReason}
      >
        <Square className="fill-current" />
        Stop
      </Button>
    </div>
  )
}
