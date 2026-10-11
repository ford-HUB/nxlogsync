import { Rocket } from 'lucide-react'
import { motion } from 'motion/react'

interface RocketBoostProps {
  /** 0.2–1, from boostIntensity. */
  intensity: number
}

/**
 * A rocket riding the left edge of the user's row while it climbs, nose up, its turbo flame
 * trailing below. The flame grows longer and flickers faster the higher the wpm.
 */
export function RocketBoost({ intensity }: RocketBoostProps) {
  const flame = 12 + 30 * intensity
  const flicker = 0.24 - 0.14 * intensity

  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: -24, transition: { duration: 0.35 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className="pointer-events-none absolute top-1/2 -left-3 z-20 flex -translate-y-1/2 flex-col items-center"
    >
      <motion.span
        animate={{ x: [0, -0.6 * intensity, 0.6 * intensity, 0] }}
        transition={{ duration: 0.12, repeat: Infinity }}
        className="flex size-6 items-center justify-center rounded-full bg-score text-background shadow-[0_0_10px_var(--score)]"
      >
        <Rocket className="size-3.5 -rotate-45" strokeWidth={2.5} />
      </motion.span>

      {/* Turbo: an outer flame with a hot core, flickering. */}
      <span className="relative -mt-1 flex justify-center" style={{ height: flame }}>
        <motion.span
          animate={{ scaleY: [1, 0.7, 1.15, 0.85, 1], opacity: [0.9, 0.7, 1, 0.8, 0.9] }}
          transition={{ duration: flicker * 2, repeat: Infinity, ease: 'linear' }}
          style={{ height: flame }}
          className="absolute top-0 w-2.5 origin-top rounded-b-full bg-gradient-to-b from-score via-score/60 to-transparent blur-[1px]"
        />
        <motion.span
          animate={{ scaleY: [1, 0.6, 1.1, 0.75, 1] }}
          transition={{ duration: flicker * 1.6, repeat: Infinity, ease: 'linear' }}
          style={{ height: flame * 0.55 }}
          className="absolute top-0 w-1 origin-top rounded-b-full bg-gradient-to-b from-background to-transparent"
        />
        {[0, 1, 2].map((k) => (
          <motion.span
            key={k}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: flame + 8, x: (k - 1) * 5, opacity: 0 }}
            transition={{ duration: 0.5 - 0.25 * intensity, repeat: Infinity, delay: k * 0.12, ease: 'easeOut' }}
            className="absolute top-1 size-1 rounded-full bg-score"
          />
        ))}
      </span>
    </motion.span>
  )
}

interface SpeedLinesProps {
  intensity: number
}

/**
 * Streaks rushing down the leaderboard while the user climbs it: more of them, longer and
 * faster as the wpm rises.
 */
export function SpeedLines({ intensity }: SpeedLinesProps) {
  const count = Math.round(8 + 18 * intensity)
  const speed = 1.1 - 0.75 * intensity

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: count }, (_, k) => {
        const length = (40 + ((k * 53) % 80)) * (0.6 + intensity)
        return (
          <motion.span
            key={k}
            initial={{ top: '-25%' }}
            animate={{ top: '115%' }}
            transition={{
              duration: speed * (0.7 + (k % 5) * 0.12),
              repeat: Infinity,
              delay: (k * 0.09) % 0.8,
              ease: 'linear',
            }}
            style={{ left: `${(k * 37 + 11) % 100}%`, height: length }}
            className={
              k % 4 === 0
                ? 'absolute w-0.5 bg-gradient-to-b from-transparent via-score/60 to-transparent'
                : 'absolute w-px bg-gradient-to-b from-transparent via-foreground/25 to-transparent'
            }
          />
        )
      })}
    </motion.div>
  )
}
