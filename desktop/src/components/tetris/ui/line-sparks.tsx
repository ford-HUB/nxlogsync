import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { BOARD_ROWS, SPARK_MS, SPARKS_PER_ROW } from '@/constants/tetris'

interface LineSparksProps {
  /** Rows being cleared right now; each new set throws a burst. */
  clearing: number[]
  /** fxSpeed for the level: at high levels the sparks fly faster and farther. */
  speed: number
}

interface Spark {
  id: number
  /** Start, as a fraction of the board. */
  left: number
  top: number
  /** Flight, in px. */
  dx: number
  dy: number
  size: number
  /** Yellow like the score, or white-hot. */
  hot: boolean
}

interface Burst {
  id: number
  sparks: Spark[]
  /** Four lines at once: a bigger burst and a label. */
  tetris: boolean
  /** Where the label sits, as a fraction of the board. */
  top: number
  /** How long this burst flies, in seconds. */
  seconds: number
}

const spread = (n: number) => (Math.random() * 2 - 1) * n

function makeBurst(id: number, rows: number[], speed: number): Burst {
  const tetris = rows.length === 4
  const sparks = rows.flatMap((row, r) =>
    Array.from({ length: SPARKS_PER_ROW * (tetris ? 1.5 : 1) }, (_, i) => ({
      id: r * 100 + i,
      left: Math.random(),
      top: (row + 0.5) / BOARD_ROWS,
      dx: spread((tetris ? 110 : 80) * Math.sqrt(speed)),
      dy: spread(50 * Math.sqrt(speed)) - 25,
      size: 2 + Math.random() * (tetris ? 4 : 3),
      hot: Math.random() < 0.35,
    })),
  )
  const middle = rows.reduce((a, b) => a + b, 0) / rows.length
  return { id, sparks, tetris, top: (middle + 0.5) / BOARD_ROWS, seconds: SPARK_MS / 1000 / speed }
}

/**
 * Sparks thrown off every cleared row, flying past the board's edges and fading out. They outlive
 * the rows' flash, so each burst is kept here until it has burnt out.
 */
export function LineSparks({ clearing, speed }: LineSparksProps) {
  const [bursts, setBursts] = useState<Burst[]>([])
  const nextId = useRef(0)
  const timers = useRef<number[]>([])

  // Not cleared when `clearing` empties again: the burst keeps flying after the rows collapse.
  useEffect(() => {
    if (clearing.length === 0) return
    const burst = makeBurst(nextId.current++, clearing, speed)
    setBursts((prev) => [...prev, burst])
    timers.current.push(
      window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== burst.id)), burst.seconds * 1000),
    )
    // Only a new clear throws a burst, not a change of speed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearing])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {bursts.map((burst) => (
        <div key={burst.id}>
          {burst.sparks.map((s) => (
            <motion.span
              key={s.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: s.dx, y: [0, s.dy, s.dy + 40], opacity: 0, scale: 0.3 }}
              transition={{ duration: burst.seconds, ease: 'easeOut' }}
              className={s.hot ? 'absolute rounded-full bg-white' : 'absolute rounded-full bg-score'}
              style={{
                left: `${s.left * 100}%`,
                top: `${s.top * 100}%`,
                width: s.size,
                height: s.size,
                boxShadow: '0 0 6px 1px var(--score)',
              }}
            />
          ))}
        </div>
      ))}
      <AnimatePresence>
        {bursts
          .filter((b) => b.tetris)
          .map((b) => (
            <motion.span
              key={`label-${b.id}`}
              initial={{ opacity: 0, scale: 0.6, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.15, 1, 1], y: -24 }}
              transition={{ duration: b.seconds, times: [0, 0.2, 0.7, 1] }}
              className="absolute left-1/2 -translate-x-1/2 font-mono text-[15px] font-bold tracking-[0.2em] text-score uppercase"
              style={{ top: `${b.top * 100}%` }}
            >
              tetris
            </motion.span>
          ))}
      </AnimatePresence>
    </div>
  )
}
