/** The seven tetrominoes. */
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

/** A board cell: empty, or the piece that locked there. */
export type Cell = PieceType | null

/** Rows top to bottom, each BOARD_COLS cells. */
export type Board = Cell[][]

/** What a skill block holds; it goes to the skill slots when its row is cleared (or bombed). */
export type SkillType = 'bomb' | 'laser' | 'slow'

/** The skill blocks locked on the board, cell for cell with Board. */
export type GemGrid = (SkillType | null)[][]

/** A piece's skill block: which of its four blocks (1–4, reading order at spawn) and the skill. */
export interface PieceGem {
  block: number
  skill: SkillType
}

/** A skill going off, for the board to animate; a new id each time one fires. */
export interface SkillFx {
  id: number
  skill: SkillType
  /** The landed piece's cells, where the effect starts. */
  cells: [number, number][]
  /** Rows a laser burned through. */
  rows: number[]
}

export interface ActivePiece {
  type: PieceType
  /** 0–3, clockwise quarter turns from spawn. */
  rotation: number
  /** The shape's top-left on the board; y may be negative while spawning. */
  x: number
  y: number
  /** Rarely, one block of the piece is a skill block. */
  gem?: PieceGem
}

/** A T piece turned into a tight slot as it locked: a full T-spin, or a mini one. */
export type TSpin = 'full' | 'mini'

/** A notable clear for the board to call out; a new id each time. */
export interface ClearCallout {
  id: number
  /** "T-spin double", "Tetris"…; null when only the B2B or combo is worth a mention. */
  title: string | null
  b2b: boolean
  /** Pieces in a row that cleared lines, after the first; 0 for none. */
  combo: number
  /** Everything the clear scored. */
  points: number
}

export type TetrisStatus = 'idle' | 'running' | 'paused' | 'over'

export interface TetrisConfig {
  /** The level the game starts on; gravity speeds up every 10 lines from there. */
  startLevel: number
  /** Show where the piece would land. */
  ghost: boolean
}

export interface TetrisResult {
  config: TetrisConfig
  score: number
  lines: number
  level: number
  /** Four-line clears. */
  tetrises: number
  /** T-spins that cleared lines. */
  tSpins: number
  /** The longest combo. */
  maxCombo: number
  pieces: number
  seconds: number
  /** Beat the previous best for this start level. */
  personalBest: boolean
}

/** One player's best game on the leaderboard for a start level. */
export interface TetrisLeaderboardEntry {
  id: string
  name: string
  score: number
  lines: number
  /** The signed-in user's own row. */
  you: boolean
}

/** The top players for one start level (a tetrisBestKey), from the server. */
export interface TetrisLeaderboard {
  setup: string
  /** Highest score first. */
  entries: TetrisLeaderboardEntry[]
  /** The signed-in user's best for the start level, on the board or not; null without one. */
  you: { rank: number; score: number; lines: number } | null
}

export interface TetrisScoreResult extends TetrisLeaderboard {
  personalBest: boolean
}

/** Everything a key can do in a game; Escape always closes it and can't be bound. */
export type TetrisAction =
  | 'left'
  | 'right'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCw'
  | 'rotateCcw'
  | 'hold'
  | 'skill'
  | 'pause'
  | 'restart'

/** Up to MAX_KEYS_PER_ACTION keys per action, as normalised KeyboardEvent.key values (letters lower-case). */
export type TetrisKeyBindings = Record<TetrisAction, string[]>
