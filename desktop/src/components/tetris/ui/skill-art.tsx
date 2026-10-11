import { useId } from 'react'
import { cn } from '@/lib/utils'
import type { SkillType } from '@/types/tetris'

interface SkillArtProps {
  skill: SkillType
  className?: string
  /**
   * Draw the rounded, gradient tile behind the picture (the slots and skills list). Off on the
   * board, where the block itself is the skill's colour and keeps its square shape.
   */
  tile?: boolean
}

/** Each tile's gradient, light at the top to the skill's colour (Tailwind 400 → 600) below. */
const TILE: Record<SkillType, [string, string]> = {
  bomb: ['#f87171', '#dc2626'],
  laser: ['#38bdf8', '#0284c7'],
  slow: ['#a78bfa', '#7c3aed'],
}

/** A four-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) =>
  `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`

/** A round black bomb, its fuse lit and throwing a spark. */
function BombArt() {
  return (
    <>
      <path d="M20.5 9.5 Q23 5 26.5 7" stroke="#fde68a" strokeWidth={1.4} strokeLinecap="round" fill="none" />
      <rect x={16.2} y={8.6} width={5} height={4} rx={1} fill="#3f3f46" transform="rotate(40 18.7 10.6)" />
      <circle cx={14} cy={19} r={8.5} fill="#18181b" />
      <ellipse cx={10.8} cy={15.6} rx={2.6} ry={1.6} fill="#fff" opacity={0.35} transform="rotate(-35 10.8 15.6)" />
      <path d={sparkle(26.5, 7, 3.6)} fill="#fde047" />
      <circle cx={26.5} cy={7} r={1} fill="#fff" />
    </>
  )
}

/** A black emitter firing a white-hot beam out to the right. */
function LaserArt() {
  return (
    <>
      <rect x={13} y={12} width={17} height={8} rx={4} fill="#fff" opacity={0.22} />
      <rect x={13} y={14} width={17} height={4} rx={2} fill="#bae6fd" />
      <rect x={13} y={15.3} width={17} height={1.4} rx={0.7} fill="#fff" />
      <rect x={5} y={8.5} width={4} height={3} rx={0.8} fill="#27272a" />
      <rect x={5} y={20.5} width={4} height={3} rx={0.8} fill="#27272a" />
      <rect x={2.5} y={10.5} width={11} height={11} rx={2.5} fill="#18181b" />
      <circle cx={13} cy={16} r={3.2} fill="#e0f2fe" />
      <circle cx={13} cy={16} r={1.4} fill="#fff" />
      <path d={sparkle(23, 8, 2.6)} fill="#fff" />
      <path d={sparkle(26, 24.5, 2)} fill="#fff" opacity={0.85} />
    </>
  )
}

/** A snail taking its time: a dark spiral shell on a pale body, eyes out on stalks. */
function SlowArt() {
  return (
    <>
      <path d="M24.6 17.5 L23.6 11.5 M26.6 17.5 L28.2 12.2" stroke="#fef3c7" strokeWidth={1.3} strokeLinecap="round" />
      <circle cx={23.6} cy={11.3} r={1.3} fill="#18181b" />
      <circle cx={28.2} cy={12} r={1.3} fill="#18181b" />
      <rect x={4} y={21} width={23} height={4.5} rx={2.25} fill="#fef3c7" />
      <circle cx={25.4} cy={20} r={3.2} fill="#fef3c7" />
      <circle cx={14} cy={15.2} r={7} fill="#18181b" />
      <path
        d="M14 15.2 a1.5 1.5 0 0 1 1.5 1.5 a3 3 0 0 1 -3 3 a4.5 4.5 0 0 1 -4.5 -4.5 a6 6 0 0 1 6 -6"
        stroke="#ddd6fe"
        strokeWidth={1.3}
        strokeLinecap="round"
        fill="none"
      />
    </>
  )
}

const ART: Record<SkillType, () => JSX.Element> = { bomb: BombArt, laser: LaserArt, slow: SlowArt }

/**
 * A skill's illustration on its coloured tile: a lit bomb, a laser emitter, a snail. Fixed colours
 * like the dock's keyboard and Tetris art, so they read the same in light and dark themes. Used on
 * the skill blocks on the board, in the slots and in the skills list.
 */
export function SkillArt({ skill, className, tile = true }: SkillArtProps) {
  const id = useId()
  const [light, dark] = TILE[skill]
  const Art = ART[skill]
  return (
    <svg viewBox="0 0 32 32" fill="none" role="img" aria-label={skill} className={cn('block', className)}>
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      {tile && (
        <>
          <rect width={32} height={32} rx={7} fill={`url(#${id}-tile)`} />
          <rect x={1.5} y={1.5} width={29} height={10} rx={5} fill="#fff" opacity={0.12} />
        </>
      )}
      <Art />
    </svg>
  )
}
