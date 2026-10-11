import type { PieceType, SkillType, TetrisConfig } from '@/types/tetris'

export const BOARD_COLS = 10
export const BOARD_ROWS = 20

export const START_LEVELS = [1, 5, 10, 15] as const

export const DEFAULT_TETRIS_CONFIG: TetrisConfig = { startLevel: 1, ghost: true }

/** Lines cleared per level up. */
export const LINES_PER_LEVEL = 10
/** Seconds survived per level up; whichever of lines or time is further ahead sets the level. */
export const SECONDS_PER_LEVEL = 60
/**
 * Every point is multiplied by this for the level the game started on, on top of the usual
 * per-level line points, so a level 15 start out-scores grinding up from level 1.
 */
export const START_LEVEL_MULTIPLIER: Record<number, number> = { 1: 1, 5: 1.5, 10: 2, 15: 3 }
/** Points for clearing 1–4 lines at once, times the level. */
export const LINE_CLEAR_POINTS = [0, 100, 300, 500, 800] as const
/** Points per cell for a soft drop and a hard drop. */
export const SOFT_DROP_POINTS = 1
export const HARD_DROP_POINTS = 2

/** How long cleared rows flash before they collapse. */
export const CLEAR_FLASH_MS = 180
/** How long a line clear's sparks fly, and how many each cleared row throws. */
export const SPARK_MS = 650
export const SPARKS_PER_ROW = 14
/** From these levels the board's animations speed up with the game: fast, then extreme. */
export const INTENSE_LEVEL = 10
export const EXTREME_LEVEL = 15
/** How long each skill's effect plays at normal speed. */
export const SKILL_FX_MS: Record<SkillType, number> = { bomb: 700, laser: 600, slow: 900 }
/** Pieces shown in the "next" queue. */
export const NEXT_PREVIEW = 3

/** Chance a new piece carries a skill block: rare, roughly one piece in sixteen. */
export const SKILL_BLOCK_CHANCE = 0.06
/** Skill slots beside the board; skills freed while they are full are lost. */
export const MAX_SKILLS = 3
/** Points per cell a bomb blasts, times the level. */
export const BOMB_POINTS_PER_CELL = 10
/** How long Slow lasts, and how much longer each row of gravity takes meanwhile. */
export const SLOW_MS = 15_000
export const SLOW_FACTOR = 2

interface SkillInfo {
  name: string
  /** What it does, in one line. */
  hint: string
  /** Its colour, wherever the skill shows: the block on the board, its slot, the skills list. */
  color: { bg: string; text: string; ring: string }
}

/** Each skill has its own colour so a block on the board says which skill it holds. */
export const SKILLS: Record<SkillType, SkillInfo> = {
  bomb: {
    name: 'Bomb',
    hint: 'The next piece blasts a 3×3 around where it lands',
    color: { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500' },
  },
  laser: {
    name: 'Laser',
    hint: 'The next piece clears every row it lands on',
    color: { bg: 'bg-sky-500', text: 'text-sky-500', ring: 'ring-sky-500' },
  },
  slow: {
    name: 'Slow',
    hint: `Gravity at half speed for ${SLOW_MS / 1000}s once the next piece lands`,
    color: { bg: 'bg-violet-500', text: 'text-violet-500', ring: 'ring-violet-500' },
  },
}
export const SKILL_TYPES = Object.keys(SKILLS) as SkillType[]

/** Each piece's spawn shape; rotations are computed by turning the matrix. */
export const SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
}

export const PIECE_TYPES = Object.keys(SHAPES) as PieceType[]

/** Sideways (and one-up) nudges tried when a rotation is blocked. */
export const WALL_KICKS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
]

/** How many players the leaderboard lists. */
export const TETRIS_LEADERBOARD_SIZE = 100
