import {
  BOARD_COLS,
  BOARD_ROWS,
  EXTREME_LEVEL,
  INTENSE_LEVEL,
  LINES_PER_LEVEL,
  PIECE_TYPES,
  SECONDS_PER_LEVEL,
  SHAPES,
  SKILL_BLOCK_CHANCE,
  SKILL_TYPES,
  START_LEVEL_MULTIPLIER,
  WALL_KICKS,
} from '@/constants/tetris'
import type { ActivePiece, Board, GemGrid, PieceGem, PieceType, SkillType } from '@/types/tetris'

const emptyGrid = <T>(): (T | null)[][] => Array.from({ length: BOARD_ROWS }, () => Array<T | null>(BOARD_COLS).fill(null))
export const emptyBoard = (): Board => emptyGrid<PieceType>()
export const emptyGems = (): GemGrid => emptyGrid<SkillType>()

/** A shuffled bag of all seven pieces, so droughts stay short. */
export function newBag(): PieceType[] {
  const bag = [...PIECE_TYPES]
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[bag[i], bag[j]] = [bag[j], bag[i]]
  }
  return bag
}

/** The spawn shape with its blocks numbered 1–4 in reading order, turned so each number follows its block. */
function labelledShape(type: PieceType, rotation: number): number[][] {
  let n = 0
  let m = SHAPES[type].map((row) => row.map((v) => (v ? ++n : 0)))
  for (let r = 0; r < ((rotation % 4) + 4) % 4; r++) m = m[0].map((_, c) => m.map((row) => row[c]).reverse())
  return m
}

/** The piece's matrix after `rotation` clockwise quarter turns. */
export const shapeOf = (type: PieceType, rotation: number): number[][] =>
  labelledShape(type, rotation).map((row) => row.map((v) => (v ? 1 : 0)))

/** The board cell of the piece's skill block, if it carries one. */
export function gemCellOf(piece: ActivePiece): [number, number] | null {
  if (!piece.gem) return null
  const m = labelledShape(piece.type, piece.rotation)
  for (let r = 0; r < m.length; r++)
    for (let c = 0; c < m[r].length; c++) if (m[r][c] === piece.gem.block) return [piece.y + r, piece.x + c]
  return null
}

/** Rarely, a skill block on one of the piece's four blocks. */
export function randomGem(): PieceGem | undefined {
  if (Math.random() >= SKILL_BLOCK_CHANCE) return undefined
  return { block: 1 + Math.floor(Math.random() * 4), skill: SKILL_TYPES[Math.floor(Math.random() * SKILL_TYPES.length)] }
}

/** The board cells a piece covers. */
export function cellsOf(piece: ActivePiece): [number, number][] {
  const cells: [number, number][] = []
  shapeOf(piece.type, piece.rotation).forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) cells.push([piece.y + r, piece.x + c])
    }),
  )
  return cells
}

/** Off the sides or bottom, or over a locked cell. Above the top is allowed while spawning. */
export function collides(board: Board, piece: ActivePiece): boolean {
  return cellsOf(piece).some(([r, c]) => c < 0 || c >= BOARD_COLS || r >= BOARD_ROWS || (r >= 0 && board[r][c] !== null))
}

/** A new piece, centred at the top. */
export function spawn(type: PieceType, gem?: PieceGem): ActivePiece {
  const width = SHAPES[type][0].length
  return { type, rotation: 0, x: Math.floor((BOARD_COLS - width) / 2), y: type === 'I' ? -1 : 0, gem }
}

/** The piece moved by (dx, dy), or null when blocked. */
export function shifted(board: Board, piece: ActivePiece, dx: number, dy: number): ActivePiece | null {
  const next = { ...piece, x: piece.x + dx, y: piece.y + dy }
  return collides(board, next) ? null : next
}

/** The piece turned (1 clockwise, -1 counter), nudged aside if needed; null when nothing fits. */
export function rotated(board: Board, piece: ActivePiece, dir: 1 | -1): ActivePiece | null {
  if (piece.type === 'O') return piece
  const turned = { ...piece, rotation: (piece.rotation + dir + 4) % 4 }
  for (const [dx, dy] of WALL_KICKS) {
    const next = { ...turned, x: turned.x + dx, y: turned.y + dy }
    if (!collides(board, next)) return next
  }
  return null
}

/** Where the piece lands if dropped straight down. */
export function dropped(board: Board, piece: ActivePiece): ActivePiece {
  let landed = piece
  for (let next = shifted(board, piece, 0, 1); next; next = shifted(board, landed, 0, 1)) landed = next
  return landed
}

/** The board with the piece locked in; `toppedOut` when part of it is still above the top. */
export function merge(board: Board, piece: ActivePiece): { board: Board; toppedOut: boolean } {
  const next = board.map((row) => [...row])
  let toppedOut = false
  for (const [r, c] of cellsOf(piece)) {
    if (r < 0) toppedOut = true
    else next[r][c] = piece.type
  }
  return { board: next, toppedOut }
}

/** Indexes of the full rows. */
export const fullRows = (board: Board) => board.flatMap((row, r) => (row.every((c) => c !== null) ? [r] : []))

/** The grid (board or skill blocks) with the given rows removed and empty rows added on top. */
export function withoutRows<T>(grid: (T | null)[][], rows: number[]): (T | null)[][] {
  const kept = grid.filter((_, r) => !rows.includes(r))
  return [...Array.from({ length: rows.length }, () => Array<T | null>(BOARD_COLS).fill(null)), ...kept]
}

/**
 * A bomb going off where the piece landed: every cell within one of its blocks is emptied.
 * Skill blocks caught in the blast are freed, like clearing their row.
 */
export function blasted(board: Board, gems: GemGrid, piece: ActivePiece) {
  const nextBoard = board.map((row) => [...row])
  const nextGems = gems.map((row) => [...row])
  const freed: SkillType[] = []
  let cleared = 0
  for (const [pr, pc] of cellsOf(piece))
    for (let r = pr - 1; r <= pr + 1; r++)
      for (let c = pc - 1; c <= pc + 1; c++) {
        if (r < 0 || r >= BOARD_ROWS || c < 0 || c >= BOARD_COLS || nextBoard[r][c] === null) continue
        nextBoard[r][c] = null
        cleared++
        const gem = nextGems[r][c]
        if (gem) freed.push(gem)
        nextGems[r][c] = null
      }
  return { board: nextBoard, gems: nextGems, cleared, freed }
}

/** One level up per 10 lines or per minute survived, whichever is further ahead. */
export const levelFor = (startLevel: number, lines: number, survivedMs: number) =>
  startLevel + Math.max(Math.floor(lines / LINES_PER_LEVEL), Math.floor(survivedMs / (SECONDS_PER_LEVEL * 1000)))

/** The bonus every point earns for the level the game started on. */
export const startMultiplier = (startLevel: number) => START_LEVEL_MULTIPLIER[startLevel] ?? 1

/** Milliseconds per row of gravity at a level (the guideline curve). */
export const gravityMs = (level: number) => Math.max(16, 1000 * Math.pow(0.8 - (level - 1) * 0.007, level - 1))

/**
 * How fast the board's animations play for a level: 1 until INTENSE_LEVEL, then 1.5, rising to
 * 2.5 by EXTREME_LEVEL, so sparks and skill effects keep pace with the falling pieces.
 */
export const fxSpeed = (level: number) =>
  level < INTENSE_LEVEL ? 1 : 1.5 + Math.min(1, (level - INTENSE_LEVEL) / (EXTREME_LEVEL - INTENSE_LEVEL))

/** Rocket/speed-line intensity for a climbing row, from the level being played. */
export const tetrisBoost = (level: number) => Math.round(Math.min(1, Math.max(0.2, level / 15)) * 10) / 10
