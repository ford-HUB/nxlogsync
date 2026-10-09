import { cn } from '@/lib/utils'

interface LiveStatsProps {
  wpm: number
  accuracy: number
  /** Seconds left in a time test, seconds so far in a words test. */
  seconds: number
  /** Before the first key: the numbers sit dimmed. */
  idle: boolean
}

function Stat({ value, unit, label }: { value: number; unit?: string; label: string }) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-1">
      <span className="flex items-baseline gap-1.5">
        <span className="text-[2rem] leading-none font-semibold text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-[15px] text-muted-foreground">{unit}</span>}
      </span>
      <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
    </div>
  )
}

/** WPM, accuracy and time above the words, updating as the test runs. */
export function LiveStats({ wpm, accuracy, seconds, idle }: LiveStatsProps) {
  return (
    <div className={cn('flex justify-center gap-14 font-mono transition-opacity duration-200', idle && 'opacity-50')}>
      <Stat value={wpm} label="wpm" />
      <Stat value={Math.round(accuracy)} unit="%" label="acc" />
      <Stat value={seconds} unit="s" label="time" />
    </div>
  )
}
