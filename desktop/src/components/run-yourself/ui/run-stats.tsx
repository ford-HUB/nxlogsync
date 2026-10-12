import { motion } from 'motion/react'
import { speedMultiplier } from '@/lib/run-engine'
import { cn } from '@/lib/utils'

interface RunStatsProps {
  points: number
  speed: number
  metres: number
  /** A speed run's finish line, in metres. */
  goal?: number
  /** Seconds so far, counting up from 0. */
  seconds: number
  /** Before the first key: the numbers sit dimmed. */
  idle: boolean
}

function Stat({ value, unit, label, hot = false }: { value: string; unit?: string; label: string; hot?: boolean }) {
  return (
    <div className="flex min-w-16 flex-col items-center gap-1">
      <span className="flex items-baseline gap-1">
        <span className={cn('text-[1.625rem] leading-none font-semibold tabular-nums sm:text-[2rem]', hot ? 'text-score' : 'text-foreground')}>
          {value}
        </span>
        {unit && <span className="text-[15px] text-muted-foreground">{unit}</span>}
      </span>
      <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
    </div>
  )
}

/** Points, the speed multiplier, metres (out of the finish line's) and the clock, counting up from 0. */
export function RunStats({ points, speed, metres, goal, seconds, idle }: RunStatsProps) {
  const multiplier = speedMultiplier(speed)
  return (
    <div className={cn('flex justify-center gap-8 font-mono transition-opacity duration-200 sm:gap-14', idle && 'opacity-50')}>
      <Stat value={Math.round(points).toLocaleString()} label="points" hot={multiplier >= 1.5} />
      <motion.div key={multiplier.toFixed(1)} initial={{ scale: 1.12 }} animate={{ scale: 1 }}>
        <Stat value={multiplier.toFixed(1)} unit="×" label="speed" hot={multiplier >= 1.5} />
      </motion.div>
      <Stat value={String(Math.min(metres, goal ?? metres))} unit={goal ? `/ ${goal}m` : 'm'} label="distance" />
      <Stat value={goal ? seconds.toFixed(1) : String(seconds)} unit="s" label="time" />
    </div>
  )
}
