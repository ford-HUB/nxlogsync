import { HeartCrack, Timer } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { SPEED_RUN_METRES } from '@/constants/run-yourself'
import { SPRITES } from '@/constants/run-yourself-sprites'
import { runBestKey } from '@/lib/run-engine'
import { cn } from '@/lib/utils'
import type { RunBest } from '@/store/run-yourself-store'
import type { RunConfig } from '@/types/run-yourself'

interface ModePickerProps {
  /** The last setup played, highlighted. */
  config: RunConfig
  bests: Record<string, RunBest>
  onPick: (config: RunConfig) => void
}

interface ModeCardProps {
  index: number
  icon: ReactNode
  title: string
  rule: string
  /** A pose from the pack that sums the game up. */
  art: string
  active: boolean
  best: RunBest | undefined
  bestLabel: (best: RunBest) => string
  onPick: () => void
}

function ModeCard({ index, icon, title, rule, art, active, best, bestLabel, onPick }: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col gap-4 rounded-xl border bg-muted/40 p-5 transition-colors hover:border-score/60',
        active && 'border-score/40',
      )}
    >
      <button
        type="button"
        onClick={onPick}
        onMouseDown={(e) => e.preventDefault()}
        aria-label={`Play ${title}`}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <div className="pointer-events-none flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <span className="text-score">{icon}</span> {title}
          </span>
          <span className="max-w-[22rem] text-[12px] leading-relaxed text-muted-foreground">{rule}</span>
        </div>
        <img src={art} alt="" draggable={false} className="h-20 w-auto shrink-0 select-none grayscale dark:invert" />
      </div>
      <div className="pointer-events-none flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          best{' '}
          <span className="text-score tabular-nums">{best ? bestLabel(best) : '—'}</span>
        </span>
        <kbd className="rounded-md border bg-background/60 px-1.5 py-0.5 text-foreground">{index + 1}</kbd>
      </div>
    </motion.div>
  )
}

/**
 * The first thing Run yourself shows: Speed run or Pass or fall (rooms after Level Devil), one per row. Clicking a card,
 * or pressing 1 / 2, picks it.
 */
export function ModePicker({ config, bests, onPick }: ModePickerProps) {
  return (
    <section aria-label="Choose a game" className="flex flex-col items-center gap-6 font-mono">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-[1.375rem] font-semibold text-foreground">Run yourself</h2>
        <p className="text-[12px] text-muted-foreground">Pick a game to start</p>
      </div>
      <div className="flex w-full max-w-xl flex-col gap-4">
        <ModeCard
          index={0}
          icon={<Timer className="size-4" />}
          title="Speed run"
          rule={`Race to the ${SPEED_RUN_METRES} m finish; the clock starts at 0. Time your punches, kicks and sweeps as enemies swing, or you're knocked out.`}
          art={SPRITES.run[0]}
          active={config.mode === 'speed-run'}
          best={bests[runBestKey({ mode: 'speed-run' })]}
          bestLabel={(b) => `${b.seconds.toFixed(1)}s · ${b.points.toLocaleString()} pts`}
          onPick={() => onPick({ mode: 'speed-run' })}
        />
        <ModeCard
          index={1}
          icon={<HeartCrack className="size-4" />}
          title="Pass or fall"
          rule="One room per level, one door out. Jump the blocks to it, but nothing in here stays where it was."
          art={SPRITES.jump[1]}
          active={config.mode === 'pass-or-fall'}
          best={bests[runBestKey({ mode: 'pass-or-fall' })]}
          bestLabel={(b) => `${b.points.toLocaleString()} pts · ${b.seconds.toFixed(1)}s`}
          onPick={() => onPick({ mode: 'pass-or-fall' })}
        />
      </div>
    </section>
  )
}
