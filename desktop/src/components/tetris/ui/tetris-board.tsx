import { useAnimate } from 'motion/react'
import { memo, useEffect, type ReactNode } from 'react'
import { BOARD_COLS, BOARD_ROWS, EXTREME_LEVEL, INTENSE_LEVEL, SKILLS } from '@/constants/tetris'
import { cellsOf, dropped, fxSpeed, gemCellOf } from '@/lib/tetris-engine'
import { cn } from '@/lib/utils'
import type { ActivePiece, Board, GemGrid, SkillFx, SkillType } from '@/types/tetris'
import { LineSparks } from './line-sparks'
import { SkillEffects } from './skill-effects'
import { SpeedStreaks } from './speed-streaks'
import { SkillArt } from './skill-art'

interface TetrisBoardProps {
  board: Board
  /** Skill blocks locked on the board. */
  gems: GemGrid
  piece: ActivePiece | null
  ghost: boolean
  /** The skill armed on the falling piece; it glows in that skill's colour until it lands. */
  armed: SkillType | null
  /** Rows flashing before they collapse. */
  clearing: number[]
  over: boolean
  /** The level being played: from INTENSE_LEVEL the animations speed up and the board glows. */
  level: number
  /** Pieces are falling (not idle, paused or over); the speed streaks run only then. */
  running: boolean
  /** The last skill that went off, for its effect. */
  skillFx: SkillFx | null
  /** Slow is in effect: the well takes on a violet tint. */
  slowed: boolean
  /** Laid over the board: the start hint, the pause note. */
  children?: ReactNode
}

type CellLook = 'empty' | 'locked' | 'active' | 'ghost' | 'clearing'

const LOOK: Record<CellLook, string> = {
  empty: 'bg-muted/45',
  locked: 'bg-foreground/80',
  active: 'bg-foreground',
  ghost: 'bg-transparent ring-1 ring-inset ring-foreground/35',
  clearing: 'bg-score',
}

/**
 * The 10×20 well. Black and white like the rest of the test: locked blocks a shade softer than
 * the falling piece, the ghost an outline, cleared rows a flash of the yellow score colour that
 * throws sparks. Skill blocks are ordinary blocks in their skill's colour with its picture on top, and each skill has its own effect
 * when it fires. From level 10 the edge glows, streaks rush past and every animation speeds up.
 */
export const TetrisBoard = memo(function TetrisBoard({
  board,
  gems,
  piece,
  ghost,
  armed,
  clearing,
  over,
  level,
  running,
  skillFx,
  slowed,
  children,
}: TetrisBoardProps) {
  const speed = fxSpeed(level)
  const intense = level >= INTENSE_LEVEL
  const extreme = level >= EXTREME_LEVEL

  // A bomb shakes the well; harder and quicker at high levels.
  const [scope, animate] = useAnimate<HTMLDivElement>()
  useEffect(() => {
    if (skillFx?.skill !== 'bomb' || !scope.current) return
    const k = Math.min(1.6, speed)
    void animate(scope.current, { x: [0, -7 * k, 7 * k, -5 * k, 4 * k, -2 * k, 0], y: [0, 3, -3, 2, -1, 0, 0] }, { duration: 0.45 / speed })
    // Only a new bomb shakes, not a change of level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillFx?.id])

  const looks: CellLook[][] = board.map((row, r) =>
    row.map((cell) => (clearing.includes(r) ? 'clearing' : cell ? 'locked' : 'empty')),
  )
  if (piece) {
    if (ghost)
      for (const [r, c] of cellsOf(dropped(board, piece))) if (r >= 0 && looks[r][c] === 'empty') looks[r][c] = 'ghost'
    for (const [r, c] of cellsOf(piece)) if (r >= 0) looks[r][c] = 'active'
  }
  const skills: (SkillType | null)[][] = gems.map((row) => [...row])
  const gemCell = piece && gemCellOf(piece)
  if (piece?.gem && gemCell && gemCell[0] >= 0) skills[gemCell[0]][gemCell[1]] = piece.gem.skill

  return (
    <div ref={scope} className="relative aspect-[1/2] h-[min(58dvh,36rem)] min-h-64">
      {intense && running && <SpeedStreaks speed={speed} extreme={extreme} />}
      {/* The well's edge glows once the game is fast, pulsing quicker as it speeds up; violet under Slow. */}
      {(intense || slowed) && (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute -inset-1.5 animate-pulse rounded-md ring-1 transition-colors duration-500',
            slowed
              ? 'bg-violet-500/5 shadow-[0_0_24px_2px_var(--color-violet-500)] ring-violet-500/60'
              : extreme
                ? 'shadow-[0_0_28px_2px_var(--score)] ring-score/70'
                : 'shadow-[0_0_16px_0px_var(--score)] ring-score/30',
          )}
          style={{ animationDuration: `${(slowed ? 2.4 : 2) / speed}s` }}
        />
      )}
      <div
        role="grid"
        aria-label="Tetris board"
        className={cn('grid size-full gap-px transition-opacity duration-300', over && 'opacity-40')}
        // Fixed rows as well as columns: a row never grows to fit what's drawn in its cells.
        style={{
          gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${BOARD_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {looks.flatMap((row, r) =>
          row.map((look, c) => {
            const skill = look === 'locked' || look === 'active' ? skills[r][c] : null
            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  'relative min-h-0 min-w-0 overflow-hidden rounded-[2px] transition-colors duration-75',
                  LOOK[look],
                  skill && SKILLS[skill].color.bg,
                  look === 'active' && armed && `animate-pulse ring-2 ring-inset ${SKILLS[armed].color.ring}`,
                )}
              >
                {/* Same square block as any other, filled with the skill's colour; the picture sits on
                    top without taking up space, so it can't stretch the cell. */}
                {skill && <SkillArt skill={skill} tile={false} className="absolute inset-[6%] size-[88%]" />}
              </div>
            )
          }),
        )}
      </div>
      <LineSparks clearing={clearing} speed={speed} />
      <SkillEffects fx={skillFx} speed={speed} />
      {children}
    </div>
  )
})
