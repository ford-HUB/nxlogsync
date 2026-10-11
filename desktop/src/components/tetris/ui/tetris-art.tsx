import { motion } from 'motion/react'

interface TetrisArtProps {
  /** Hovered: the T piece falls a few rows and settles, over and over. */
  dropping: boolean
}

/** Block size and grid step, in viewBox units: a 4-column well, six rows tall. */
const BLOCK = 5.5
const STEP = 6.2
/** Top-left of grid cell [col, row]. */
const cell = (col: number, row: number): [number, number] => [5 + col * STEP, 5 + row * STEP]
/** The T piece falls two rows while hovered. */
const FALL = STEP * 2
const T_PIECE = [cell(0, 0), cell(1, 0), cell(2, 0), cell(1, 1)]
/** The settled stack: an O bottom-left, a J bottom-right. */
const STACK = [cell(0, 4), cell(1, 4), cell(0, 5), cell(1, 5), cell(3, 3), cell(3, 4), cell(3, 5), cell(2, 5)]

function Block({ x, y }: { x: number; y: number }) {
  return (
    <>
      <rect x={x} y={y + 0.8} width={BLOCK} height={BLOCK} rx={1.1} fill="#a1a1aa" />
      <rect x={x} y={y} width={BLOCK} height={BLOCK - 0.4} rx={1.1} fill="#fafafa" />
    </>
  )
}

/**
 * A falling T above a settled stack in a dark, portrait well. Fixed colours like the keyboard, so
 * it reads the same in light and dark themes; the blocks match its keycaps.
 */
export function TetrisArt({ dropping }: TetrisArtProps) {
  return (
    <svg viewBox="0 0 34 48" fill="none" className="size-full overflow-visible">
      <rect x={1} y={1} width={32} height={46} rx={4.5} fill="#18181b" />
      <motion.g
        animate={dropping ? { y: [0, FALL / 2, FALL, FALL, 0] } : { y: 0 }}
        transition={
          dropping
            ? { duration: 1.4, times: [0, 0.2, 0.4, 0.85, 1], ease: 'linear', repeat: Infinity }
            : { duration: 0.15 }
        }
      >
        {T_PIECE.map(([x, y]) => (
          <Block key={`t-${x}-${y}`} x={x} y={y} />
        ))}
      </motion.g>
      {STACK.map(([x, y]) => (
        <Block key={`s-${x}-${y}`} x={x} y={y} />
      ))}
    </svg>
  )
}
