import { Crown, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { startMultiplier } from '@/lib/tetris-engine'
import type { TetrisResult } from '@/types/tetris'

interface GameResultsProps {
  result: TetrisResult
  onPlayAgain: () => void
}

/** A small label over a yellow number, like the typing test's results. */
function Stat({ label, value, hint, big = false }: { label: string; value: string; hint?: string; big?: boolean }) {
  const body = (
    <div className="flex flex-col">
      <span className={big ? 'text-2xl text-muted-foreground' : 'text-[13px] text-muted-foreground'}>{label}</span>
      <span className={big ? 'text-6xl leading-none font-semibold text-score tabular-nums' : 'text-2xl leading-tight text-score tabular-nums'}>
        {value}
      </span>
    </div>
  )
  if (!hint) return body
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default">{body}</div>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/** The finished game: score up front, then the detail row. */
export function GameResults({ result, onPlayAgain }: GameResultsProps) {
  const perMinute = result.seconds > 0 ? (result.pieces / result.seconds) * 60 : 0
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center gap-10 font-mono"
    >
      <div className="flex flex-col items-center gap-2">
        <Stat big label="score" value={result.score.toLocaleString()} />
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
          <span className="text-[13px] text-muted-foreground">game type</span>
          <span className="text-[13px] text-score">
            start level {result.config.startLevel}
            {startMultiplier(result.config.startLevel) > 1 ? ` · ×${startMultiplier(result.config.startLevel)} points` : ''}
            {result.config.ghost ? ' · ghost' : ''}
          </span>
        </div>
        <Stat label="lines" value={String(result.lines)} />
        <Stat label="level" value={String(result.level)} hint={`Reached from level ${result.config.startLevel}: every 10 lines or minute survived`} />
        <Stat label="tetrises" value={String(result.tetrises)} hint="Four lines cleared at once" />
        <Stat label="pieces" value={String(result.pieces)} hint={`${perMinute.toFixed(1)} pieces per minute`} />
        <Stat label="time" value={`${Math.round(result.seconds)}s`} hint={`${result.seconds.toFixed(2)}s`} />
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Play again" onClick={onPlayAgain}>
            <RotateCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Play again · Tab</TooltipContent>
      </Tooltip>
    </motion.section>
  )
}
