import { motion } from 'motion/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SpeedStreaksProps {
  /** fxSpeed for the level; the streaks rush faster as it rises. */
  speed: number
  /** Extreme levels: more streaks, in the score colour. */
  extreme: boolean
}

const STREAKS = 14
/** Seconds for a streak to cross the board at fxSpeed 1. */
const BASE_SECONDS = 1.1

/**
 * Faint streaks rushing down either side of the board once the game is fast, so the speed shows
 * even between pieces. They run faster with the level, and turn yellow at extreme levels.
 */
export function SpeedStreaks({ speed, extreme }: SpeedStreaksProps) {
  const [streaks] = useState(() =>
    Array.from({ length: STREAKS }, (_, i) => ({
      id: i,
      // Half on the left gutter, half on the right, never over the well itself.
      left: i % 2 === 0 ? -14 + Math.random() * 10 : 104 + Math.random() * 10,
      height: 18 + Math.random() * 30,
      delay: Math.random() * BASE_SECONDS,
      jitter: 0.75 + Math.random() * 0.5,
    })),
  )
  const shown = extreme ? streaks : streaks.slice(0, STREAKS / 2)

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {shown.map((s) => (
        <motion.span
          key={s.id}
          initial={{ top: '-30%', opacity: 0 }}
          animate={{ top: '110%', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: (BASE_SECONDS * s.jitter) / speed,
            delay: s.delay / speed,
            repeat: Infinity,
            ease: 'linear',
          }}
          className={cn(
            'absolute w-px rounded-full bg-gradient-to-b from-transparent',
            extreme ? 'to-score' : 'to-foreground/40',
          )}
          style={{ left: `${s.left}%`, height: `${s.height}%` }}
        />
      ))}
    </div>
  )
}
