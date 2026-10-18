import { motion } from 'motion/react'
import { useId } from 'react'

interface PewPewArtProps {
  /** Hovered: the shards burst further out and the impact flares. */
  burst?: boolean
}

/** The chunk knocked out of the orb's upper right, where the shot landed. */
const NOTCH = '30,11 29,17 33,21 30,26 36,30 41,27 42,17 38,10'

/** Cracks spreading from the notch across the orb. */
const CRACKS = [
  'M29 17 L23 19 L17 16 L11 20',
  'M30 26 L24 29 L21 35 L14 37',
  'M23 19 L24 29',
  'M17 16 L16 25 L21 35',
  'M16 25 L7 27',
  'M11 20 L8 15',
  'M24 29 L31 33 L33 38',
  'M21 35 L22 42',
]

/** Shards flying off the notch: their resting spot, and how far they travel on burst. */
const SHARDS = [
  { points: '0,0 3.2,-1 2.4,2.6', x: 38, y: 7, dx: 3, dy: -3, rotate: 40 },
  { points: '0,0 2.6,0.4 1.2,2.4', x: 43, y: 12, dx: 4, dy: -1, rotate: -30 },
  { points: '0,0 3,1 0.6,2.8', x: 42, y: 20, dx: 4, dy: 1, rotate: 55 },
  { points: '0,0 2,-0.6 1.6,1.6', x: 34, y: 4, dx: 1, dy: -3, rotate: -60 },
  { points: '0,0 1.8,0.2 0.8,1.6', x: 46, y: 6, dx: 2, dy: -2, rotate: 80 },
  { points: '0,0 1.6,0.8 0.4,1.6', x: 45, y: 25, dx: 3, dy: 2, rotate: -45 },
]

/**
 * The PewPew mark: an orb shattering where a shot hit it, shards flying off, with a smaller orb
 * behind. Drawn in `--pew-pew-ink`, with the cracks and flash cut in `--pew-pew-paper` (the theme's
 * foreground and background unless a tile sets its own), so it keeps the app's neutral palette.
 */
export function PewPewArt({ burst = false }: PewPewArtProps) {
  const id = useId()
  const shade = `${id}-shade`
  const notch = `${id}-notch`
  const glow = `${id}-glow`

  return (
    <svg viewBox="0 0 48 48" fill="none" className="size-full overflow-visible text-(--pew-pew-ink,var(--foreground))">
      <defs>
        <radialGradient id={shade} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="currentColor" stopOpacity={0.35} />
          <stop offset="0.6" stopColor="currentColor" stopOpacity={0.7} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0.95} />
        </radialGradient>
        <mask id={notch}>
          <rect width="48" height="48" fill="white" />
          <polygon points={NOTCH} fill="black" />
        </mask>
        <filter id={glow} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      {/* The small orb behind. */}
      <circle cx={8} cy={8} r={4.5} fill={`url(#${shade})`} />

      {/* The orb, with its broken chunk and cracks. */}
      <g mask={`url(#${notch})`}>
        <circle cx={22} cy={27} r={17} fill={`url(#${shade})`} />
        {CRACKS.map((d) => (
          <path key={d} d={d} stroke="var(--pew-pew-paper, var(--background))" strokeWidth={0.9} strokeLinejoin="round" />
        ))}
      </g>

      {/* The impact flash inside the break. */}
      <motion.circle
        cx={31}
        cy={21}
        r={3}
        fill="var(--pew-pew-paper, var(--background))"
        filter={`url(#${glow})`}
        animate={{ opacity: burst ? 1 : 0.7, scale: burst ? 1.5 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
      />

      {SHARDS.map((s) => (
        <motion.polygon
          key={s.points + s.x}
          points={s.points}
          fill="currentColor"
          fillOpacity={0.8}
          initial={false}
          animate={{
            x: s.x + (burst ? s.dx : 0),
            y: s.y + (burst ? s.dy : 0),
            rotate: burst ? s.rotate : 0,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        />
      ))}
    </svg>
  )
}
