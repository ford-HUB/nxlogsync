import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { BOARD_COLS, BOARD_ROWS, SKILL_FX_MS } from '@/constants/tetris'
import { cn } from '@/lib/utils'
import type { SkillFx } from '@/types/tetris'

interface SkillEffectsProps {
  /** The last skill that went off; each new id plays its effect once. */
  fx: SkillFx | null
  /** fxSpeed for the level: effects play faster as the game does. */
  speed: number
}

/** Board fractions to CSS percentages. */
const pct = (n: number) => `${n * 100}%`
const spread = (n: number) => (Math.random() * 2 - 1) * n

/** The middle of a set of cells, as fractions of the board. */
function centreOf(cells: [number, number][]) {
  const r = cells.reduce((sum, [row]) => sum + row, 0) / cells.length
  const c = cells.reduce((sum, [, col]) => sum + col, 0) / cells.length
  return { left: (c + 0.5) / BOARD_COLS, top: (r + 0.5) / BOARD_ROWS }
}

/** A word that pops over the effect in the skill's colour. */
function Callout({ text, className, top, seconds }: { text: string; className: string; top: number; seconds: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 1], y: -28 }}
      transition={{ duration: seconds, times: [0, 0.2, 0.7, 1] }}
      className={cn('absolute left-1/2 -translate-x-1/2 font-mono text-[15px] font-bold tracking-[0.2em] uppercase', className)}
      style={{ top: pct(top) }}
    >
      {text}
    </motion.span>
  )
}

/** Bomb: a white-hot flash, a red shockwave, and debris flung out of the 3×3 blast. */
function BombBlast({ fx, seconds }: { fx: SkillFx; seconds: number }) {
  const { left, top } = centreOf(fx.cells)
  const [debris] = useState(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      dx: spread(130),
      dy: spread(130),
      rotate: spread(360),
      size: 3 + Math.random() * 5,
      tone: ['bg-red-500', 'bg-orange-400', 'bg-foreground/80'][i % 3],
    })),
  )
  return (
    <div className="absolute size-0" style={{ left: pct(left), top: pct(top) }}>
      <motion.span
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: seconds * 0.5, ease: 'easeOut' }}
        className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,white,var(--color-orange-400)_35%,var(--color-red-500)_60%,transparent_70%)]"
      />
      <motion.span
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 4.5, opacity: 0 }}
        transition={{ duration: seconds * 0.8, ease: 'easeOut' }}
        className="absolute size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-red-500"
      />
      {debris.map((d) => (
        <motion.span
          key={d.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: d.dx, y: [0, d.dy, d.dy + 50], rotate: d.rotate, opacity: 0 }}
          transition={{ duration: seconds, ease: 'easeOut' }}
          className={cn('absolute rounded-[1px]', d.tone)}
          style={{ width: d.size, height: d.size }}
        />
      ))}
      <Callout text="boom" className="text-red-500" top={0} seconds={seconds} />
    </div>
  )
}

/** Laser: a beam sweeps each burned row left to right, then collapses to a line and fades. */
function LaserBeams({ fx, seconds }: { fx: SkillFx; seconds: number }) {
  const rows = fx.rows.length > 0 ? fx.rows : [...new Set(fx.cells.map(([r]) => r))]
  const middle = rows.reduce((a, b) => a + b, 0) / rows.length
  return (
    <>
      {rows.map((row, i) => (
        <div key={row} className="absolute -inset-x-6" style={{ top: pct(row / BOARD_ROWS), height: pct(1 / BOARD_ROWS) }}>
          <motion.div
            initial={{ scaleX: 0, scaleY: 1, opacity: 1 }}
            animate={{ scaleX: [0, 1, 1], scaleY: [1, 1, 0.1], opacity: [1, 1, 0] }}
            transition={{ duration: seconds, times: [0, 0.3, 1], delay: i * 0.04, ease: 'easeOut' }}
            style={{ originX: 0 }}
            className="absolute inset-0 rounded-full bg-sky-500/70 shadow-[0_0_18px_4px_var(--color-sky-500)]"
          >
            <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-white" />
          </motion.div>
        </div>
      ))}
      <Callout text="laser" className="text-sky-500" top={(middle + 0.5) / BOARD_ROWS} seconds={seconds} />
    </>
  )
}

/** Slow: violet ripples spread from where the piece landed as time thickens. */
function SlowRipples({ fx, seconds }: { fx: SkillFx; seconds: number }) {
  const { left, top } = centreOf(fx.cells)
  return (
    <>
      <motion.div
        initial={{ opacity: 0.35 }}
        animate={{ opacity: 0 }}
        transition={{ duration: seconds }}
        className="absolute inset-0 rounded-[2px] bg-violet-500/40"
      />
      <div className="absolute size-0" style={{ left: pct(left), top: pct(top) }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0.1, opacity: 0.9 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: seconds * 0.8, delay: i * seconds * 0.12, ease: 'easeOut' }}
            className="absolute size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-violet-500"
          />
        ))}
        <Callout text="slow" className="text-violet-500" top={0} seconds={seconds} />
      </div>
    </>
  )
}

/**
 * The effect for each skill as it fires, laid over the board: a bomb blast, laser beams, or slow
 * ripples. Each plays out fully even after the board has moved on.
 */
export function SkillEffects({ fx, speed }: SkillEffectsProps) {
  const [playing, setPlaying] = useState<{ fx: SkillFx; seconds: number }[]>([])
  const timers = useRef<number[]>([])

  useEffect(() => {
    if (!fx) return
    const ms = SKILL_FX_MS[fx.skill] / speed
    setPlaying((prev) => [...prev, { fx, seconds: ms / 1000 }])
    timers.current.push(window.setTimeout(() => setPlaying((prev) => prev.filter((p) => p.fx.id !== fx.id)), ms))
    // Only a new skill going off starts an effect, not a change of speed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx?.id])
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {playing.map(({ fx: f, seconds }) =>
        f.skill === 'bomb' ? (
          <BombBlast key={f.id} fx={f} seconds={seconds} />
        ) : f.skill === 'laser' ? (
          <LaserBeams key={f.id} fx={f} seconds={seconds} />
        ) : (
          <SlowRipples key={f.id} fx={f} seconds={seconds} />
        ),
      )}
    </div>
  )
}
