import { LogOut, Pause, Play } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import type { AimLabGameState } from '@/types/aim-lab'

interface AimLabPauseProps {
  game: AimLabGameState
  onResume: () => void
  onExit: () => void
}

/** Shown when Esc releases the mouse mid-round: the clock is stopped until Resume, or Exit ends the round. */
export function AimLabPause({ game, onResume, onExit }: AimLabPauseProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 flex items-center justify-center bg-black/55 p-4"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aim-lab-paused"
        initial={{ y: 10, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="flex w-full max-w-xs flex-col gap-5 rounded-2xl border bg-background p-6 shadow-2xl"
      >
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted">
            <Pause className="size-5" />
          </span>
          <h2 id="aim-lab-paused" className="text-lg font-semibold">
            Paused
          </h2>
          <p className="font-mono text-[12px] text-muted-foreground tabular-nums">
            {game.timeLeft.toFixed(1)}s left · {game.score} hits
          </p>
        </header>

        <div className="flex flex-col gap-2">
          <Button type="button" size="lg" className="h-10" onClick={onResume} autoFocus>
            <Play /> Resume
          </Button>
          <Button type="button" variant="outline" size="lg" className="h-10" onClick={onExit}>
            <LogOut /> Exit round
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
