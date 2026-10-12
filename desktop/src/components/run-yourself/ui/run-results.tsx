import { Crown, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SPEED_RUN_METRES } from '@/constants/run-yourself'
import { speedMultiplier } from '@/lib/run-engine'
import type { RunResult } from '@/types/run-yourself'

interface RunResultsProps {
  result: RunResult
  onRestart: () => void
}

const runLabel = ({ mode }: RunResult['config']) => (mode === 'speed-run' ? `speed run · ${SPEED_RUN_METRES}m` : 'pass or fall')

/** A small label over a yellow number, like the typing test's results. */
function Stat({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={big ? 'text-2xl text-muted-foreground' : 'text-[13px] text-muted-foreground'}>{label}</span>
      <span className={big ? 'text-6xl leading-none font-semibold text-score tabular-nums' : 'text-2xl leading-tight text-score tabular-nums'}>
        {value}
      </span>
    </div>
  )
}

/**
 * How the run went: points up front (or that an enemy knocked you out short of the finish), then
 * distance, knockouts, obstacles, crashes, top speed and time.
 */
export function RunResults({ result, onRestart }: RunResultsProps) {
  const fell = result.knockedOut
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center gap-8 font-mono"
    >
      <div className="flex flex-col items-center gap-2">
        <Stat big label={fell ? 'knocked out · points' : 'points'} value={result.points.toLocaleString()} />
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
          <span className="text-[13px] text-score">{runLabel(result.config)}</span>
        </div>
        <Stat label="distance" value={`${result.metres}m`} />
        <Stat label="knockouts" value={String(result.knockouts)} />
        <Stat label="cleared" value={String(result.cleared - result.knockouts)} />
        <Stat label="crashes" value={String(result.crashes)} />
        <Stat label="top speed" value={`${speedMultiplier(result.topSpeed).toFixed(1)}×`} />
        <Stat label={fell ? 'time' : 'finish time'} value={fell ? `${Math.round(result.seconds)}s` : `${result.seconds.toFixed(1)}s`} />
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Run again" onClick={onRestart}>
            <RotateCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Run again · Tab</TooltipContent>
      </Tooltip>
    </motion.section>
  )
}
