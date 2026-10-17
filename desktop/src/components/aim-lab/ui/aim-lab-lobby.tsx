import { Play, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { AimLabSensitivity } from '@/components/aim-lab/ui/aim-lab-sensitivity'
import { PewPewArt } from '@/components/aim-lab/ui/pew-pew-art'
import { AIM_LAB_ACTIVE_TARGETS } from '@/constants/aim-lab'
import type { AimLabScoreEvent } from '@/types/aim-lab'

interface AimLabLobbyProps {
  /** The selected round length. */
  seconds: number
  /** The round just finished, for the results; null on the start screen. */
  lastRound: AimLabScoreEvent | null
  /** The best round since the app opened, for the selected length. */
  bestRound: AimLabScoreEvent | null
  sensitivity: number
  onSensitivityChange: (value: number) => void
  onStart: () => void
}

/** The start screen and, after a round, its results: what gridshot is, the sensitivity, and Start. */
export function AimLabLobby({
  seconds,
  lastRound,
  bestRound,
  sensitivity,
  onSensitivityChange,
  onStart,
}: AimLabLobbyProps) {
  const newBest = lastRound !== null && lastRound === bestRound

  return (
    <motion.section
      initial={{ y: 12, scale: 0.98 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-background p-6 shadow-2xl sm:p-8"
    >
      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          <span className="size-4">
            <PewPewArt />
          </span>
          PewPew
        </span>
        <h2 className="text-2xl font-semibold tracking-tight">{lastRound ? 'Round over' : 'Gridshot'}</h2>
        {!lastRound && (
          <p className="text-sm text-muted-foreground">
            {AIM_LAB_ACTIVE_TARGETS} targets at a time. Each hit spawns a new one somewhere else. Hit as many as you
            can in {seconds} seconds; misses lower your accuracy.
          </p>
        )}
      </header>

      {lastRound ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <span className="font-mono text-6xl leading-none font-semibold tabular-nums">{lastRound.score}</span>
            <span className="pb-1 font-mono text-sm text-muted-foreground">hits</span>
            {newBest && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-1 ml-auto rounded-full bg-score/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-score"
              >
                New best
              </motion.span>
            )}
          </div>
          <dl className="grid grid-cols-3 gap-3 font-mono">
            <Figure label="accuracy" value={`${lastRound.accuracy.toFixed(1)}%`} />
            <Figure label="shots" value={`${lastRound.shotsHit}/${lastRound.shotsFired}`} />
            <Figure label="best" value={bestRound ? String(bestRound.score) : '—'} />
          </dl>
        </div>
      ) : (
        <dl className="grid grid-cols-3 gap-3 font-mono">
          <Figure label="time" value={`${seconds}s`} />
          <Figure label="targets" value={String(AIM_LAB_ACTIVE_TARGETS)} />
          <Figure label="best" value={bestRound ? String(bestRound.score) : '—'} />
        </dl>
      )}

      <AimLabSensitivity value={sensitivity} onChange={onSensitivityChange} />

      <Button type="button" size="lg" className="h-11 text-sm" onClick={onStart}>
        {lastRound ? <RotateCcw /> : <Play />}
        {lastRound ? 'Play again' : 'Start'}
      </Button>
    </motion.section>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-3 py-2">
      <dt className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{label}</dt>
      <dd className="text-lg leading-none tabular-nums">{value}</dd>
    </div>
  )
}
