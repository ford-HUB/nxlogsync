import { Crown, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ROOM_ATTEMPTS, ROOM_LEVELS } from '@/constants/run-rooms'
import { cn } from '@/lib/utils'
import type { RoomResult } from '@/types/run-rooms'

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

interface RoomStatsProps {
  points: number
  /** Index of the room being played. */
  level: number
  deaths: number
  seconds: number
  idle: boolean
}

/** Points, the level out of all of them, attempts left and the clock, like the speed run's row. */
export function RoomStats({ points, level, deaths, seconds, idle }: RoomStatsProps) {
  return (
    <div className={cn('flex justify-center gap-8 font-mono transition-opacity duration-200 sm:gap-14', idle && 'opacity-50')}>
      <Stat value={points.toLocaleString()} label="points" />
      <Stat value={String(level + 1)} unit={`/ ${ROOM_LEVELS.length}`} label="level" />
      {/* Counts down with each fall; yellow on the last one. */}
      <motion.div key={deaths} initial={{ scale: deaths ? 1.25 : 1 }} animate={{ scale: 1 }}>
        <Stat value={String(Math.max(0, ROOM_ATTEMPTS - deaths))} unit={`/ ${ROOM_ATTEMPTS}`} label="attempts" hot={ROOM_ATTEMPTS - deaths <= 1} />
      </motion.div>
      <Stat value={String(Math.floor(seconds))} unit="s" label="time" />
    </div>
  )
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-2xl leading-tight text-score tabular-nums">{value}</span>
    </div>
  )
}

/** Out of the last door, or out of attempts: points up front, then levels, falls and the time it took. */
export function RoomResults({ result, onRestart }: { result: RoomResult; onRestart: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center gap-8 font-mono"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-col">
          <span className="text-2xl text-muted-foreground">{result.escaped ? 'you got out with' : 'out of attempts at'}</span>
          <span className="text-6xl leading-none font-semibold text-score tabular-nums">{result.points.toLocaleString()}</span>
        </div>
        {result.personalBest && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.2 }}
            className="flex w-fit items-center gap-1 rounded-full bg-score/15 px-2 py-0.5 text-[11px] font-medium text-score"
          >
            <Crown className="size-3" /> new personal best
          </motion.span>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted-foreground">game</span>
          <span className="text-[13px] text-score">pass or fall</span>
        </div>
        <ResultStat label="levels" value={`${result.levels}/${ROOM_LEVELS.length}`} />
        <ResultStat label="falls" value={String(result.deaths)} />
        <ResultStat label="time" value={`${result.seconds.toFixed(1)}s`} />
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Play again" onClick={onRestart}>
            <RotateCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Play again · Tab</TooltipContent>
      </Tooltip>
    </motion.section>
  )
}
