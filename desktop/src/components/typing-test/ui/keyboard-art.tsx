import { motion } from 'motion/react'

interface KeyboardArtProps {
  /** Hovered: a few keys tap down in turn, as if someone were typing. */
  typing: boolean
}

/** Key rows: x offsets and widths in viewBox units; the space bar sits on the last row. */
const ROWS = [
  { y: 9, keys: [6, 13, 20, 27, 34, 41, 48].map((x) => ({ x, w: 5.5 })) },
  { y: 16, keys: [8, 15, 22, 29, 36, 43].map((x) => ({ x, w: 5.5 })) },
  { y: 23, keys: [6, 13, { x: 20, w: 19.5 }, 41, 48].map((k) => (typeof k === 'number' ? { x: k, w: 5.5 } : k)) },
]
/** Keys (row, index) that tap while hovered, in order. */
const TAPS: [number, number][] = [
  [0, 1],
  [1, 3],
  [0, 4],
  [2, 2],
  [1, 0],
]

/**
 * A small mechanical keyboard. The colours are fixed (it is an illustration), black and white
 * so it reads the same in light and dark themes and sits quietly beside the blue Trash.
 */
export function KeyboardArt({ typing }: KeyboardArtProps) {
  return (
    <svg viewBox="0 0 60 34" fill="none" className="size-full overflow-visible">
      <rect x={1} y={3} width={58} height={29} rx={4.5} fill="#18181b" stroke="#09090b" strokeWidth={1} />
      <rect x={2.5} y={4.5} width={55} height={3} rx={1.5} fill="#27272a" />
      {ROWS.map((row, r) =>
        row.keys.map((key, k) => {
          const tap = TAPS.findIndex(([tr, tk]) => tr === r && tk === k)
          return (
            <motion.g
              key={`${r}-${k}`}
              animate={typing && tap >= 0 ? { y: [0, 1.2, 0] } : { y: 0 }}
              transition={
                typing && tap >= 0
                  ? { duration: 0.22, delay: tap * 0.18, repeat: Infinity, repeatDelay: TAPS.length * 0.18 - 0.22 }
                  : { duration: 0.15 }
              }
            >
              <rect x={key.x} y={row.y + 1} width={key.w} height={5.5} rx={1.2} fill="#a1a1aa" />
              <rect x={key.x} y={row.y} width={key.w} height={5} rx={1.2} fill="#fafafa" />
            </motion.g>
          )
        }),
      )}
    </svg>
  )
}
