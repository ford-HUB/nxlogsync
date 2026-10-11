import { AnimatePresence, motion } from 'motion/react'
import { CLEAR_CALLOUT_MS } from '@/constants/tetris'
import type { ClearCallout as Callout } from '@/types/tetris'

interface ClearCalloutProps {
  /** The last notable clear; each new id pops once. */
  callout: Callout | null
  /** fxSpeed for the level: it pops quicker as the game speeds up. */
  speed: number
}

/**
 * "T-spin double", "Tetris", "B2B", "combo 3" and the points they earned, popping up over the
 * top of the well in the score colour, then drifting up and fading.
 */
export function ClearCallout({ callout, speed }: ClearCalloutProps) {
  const seconds = CLEAR_CALLOUT_MS / 1000 / Math.min(speed, 1.6)
  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[18%] flex justify-center">
      <AnimatePresence>
        {callout && (
          <motion.div
            key={callout.id}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1], y: [8, 0, 0, -24] }}
            transition={{ duration: seconds, times: [0, 0.18, 0.7, 1] }}
            className="flex flex-col items-center gap-0.5 font-mono text-score drop-shadow-[0_0_10px_var(--score)]"
          >
            {callout.title && <span className="text-[17px] font-bold tracking-[0.18em] uppercase">{callout.title}</span>}
            {(callout.b2b || callout.combo > 0) && (
              <span className="flex gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase">
                {callout.b2b && <span>B2B ×1.5</span>}
                {callout.combo > 0 && <span>combo {callout.combo}</span>}
              </span>
            )}
            <span className="text-[12px] tabular-nums">+{callout.points.toLocaleString()}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
