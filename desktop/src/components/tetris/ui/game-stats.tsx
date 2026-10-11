import { cn } from '@/lib/utils'

interface GameStatsProps {
  score: number
  lines: number
  level: number
  seconds: number
  /** Before the first piece: the numbers sit dimmed. */
  idle: boolean
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-1">
      <span className="text-[1.625rem] leading-none font-semibold text-foreground tabular-nums sm:text-[2rem]">{value}</span>
      <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
    </div>
  )
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** Score, lines, level and time above the board, updating as the game runs. */
export function GameStats({ score, lines, level, seconds, idle }: GameStatsProps) {
  return (
    <div className={cn('flex justify-center gap-8 font-mono transition-opacity duration-200 sm:gap-14', idle && 'opacity-50')}>
      <Stat value={score.toLocaleString()} label="score" />
      <Stat value={lines} label="lines" />
      <Stat value={level} label="level" />
      <Stat value={clock(seconds)} label="time" />
    </div>
  )
}
