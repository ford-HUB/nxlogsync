import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  BOMB_POINTS_PER_CELL,
  CLEAR_FLASH_MS,
  HARD_DROP_POINTS,
  LINE_CLEAR_POINTS,
  MAX_SKILLS,
  NEXT_PREVIEW,
  SLOW_FACTOR,
  SLOW_MS,
  SOFT_DROP_POINTS,
} from '@/constants/tetris'
import {
  blasted,
  cellsOf,
  collides,
  dropped,
  emptyBoard,
  emptyGems,
  fullRows,
  gemCellOf,
  gravityMs,
  levelFor,
  merge,
  newBag,
  randomGem,
  rotated,
  shifted,
  spawn,
  startMultiplier,
  withoutRows,
} from '@/lib/tetris-engine'
import { useTetrisStore } from '@/store/tetris-store'
import type {
  ActivePiece,
  Board,
  GemGrid,
  PieceGem,
  PieceType,
  SkillFx,
  SkillType,
  TetrisConfig,
  TetrisResult,
  TetrisStatus,
} from '@/types/tetris'

interface GameState {
  config: TetrisConfig
  board: Board
  /** Skill blocks locked on the board. */
  gems: GemGrid
  piece: ActivePiece | null
  /** Upcoming pieces, refilled a bag at a time. */
  queue: PieceType[]
  hold: PieceType | null
  /** The held piece's skill block, kept with it. */
  holdGem: PieceGem | null
  /** One hold per piece. */
  canHold: boolean
  /** Freed skills, oldest first; V arms the first on the falling piece. */
  skills: SkillType[]
  /** The skill that fires when the falling piece lands. */
  armed: SkillType | null
  /** The last skill that went off, for the board's effect. */
  skillFx: SkillFx | null
  /** Slow's gravity lasts until this time, pushed back by any pause. */
  slowUntil: number | null
  score: number
  lines: number
  level: number
  tetrises: number
  pieces: number
  status: TetrisStatus
  /** Full rows flashing before they collapse; the next piece waits for them. */
  clearing: number[]
  startedAt: number | null
  /** Time spent paused, left out of the clock. */
  pausedMs: number
  pausedAt: number | null
  endedAt: number | null
}

type Action =
  | { type: 'reset'; config: TetrisConfig }
  | { type: 'start'; now: number }
  | { type: 'move'; dx: number }
  | { type: 'rotate'; dir: 1 | -1 }
  | { type: 'soft-drop' }
  | { type: 'hard-drop'; now: number }
  | { type: 'hold' }
  | { type: 'use-skill' }
  | { type: 'tick'; now: number }
  | { type: 'collapse'; now: number }
  | { type: 'toggle-pause'; now: number }

const topUp = (queue: PieceType[]) => (queue.length > NEXT_PREVIEW ? queue : [...queue, ...newBag()])

function initial(config: TetrisConfig): GameState {
  return {
    config,
    board: emptyBoard(),
    gems: emptyGems(),
    piece: null,
    queue: topUp([]),
    hold: null,
    holdGem: null,
    canHold: true,
    skills: [],
    armed: null,
    skillFx: null,
    slowUntil: null,
    score: 0,
    lines: 0,
    level: config.startLevel,
    tetrises: 0,
    pieces: 0,
    status: 'idle',
    clearing: [],
    startedAt: null,
    pausedMs: 0,
    pausedAt: null,
    endedAt: null,
  }
}

/** The next piece from the queue; the game ends when it has no room. */
function spawnNext(state: GameState, now: number): GameState {
  const [type, ...rest] = state.queue
  const piece = spawn(type, randomGem())
  if (collides(state.board, piece)) return { ...state, piece: null, status: 'over', endedAt: now }
  return { ...state, piece, queue: topUp(rest), canHold: true }
}

const survivedMs = (s: GameState, now: number) => (s.startedAt === null ? 0 : now - s.startedAt - s.pausedMs)

/** Points earned, with the start level's bonus. */
const points = (s: GameState, base: number) => Math.round(base * startMultiplier(s.config.startLevel))

/**
 * Locks the piece and fires the skill armed on it; full rows start flashing, otherwise the next
 * piece drops in. Skill blocks in cleared (or bombed) rows go to the skill slots.
 */
function lock(state: GameState, piece: ActivePiece, dropPoints: number, now: number): GameState {
  const { board, toppedOut } = merge(state.board, piece)
  const gems = state.gems.map((row) => [...row])
  const gemCell = gemCellOf(piece)
  if (piece.gem && gemCell && gemCell[0] >= 0) gems[gemCell[0]][gemCell[1]] = piece.gem.skill
  let next: GameState = {
    ...state,
    board,
    gems,
    piece: null,
    armed: null,
    score: state.score + points(state, dropPoints),
    pieces: state.pieces + 1,
  }
  if (toppedOut) return { ...next, status: 'over', endedAt: now }

  const freed: SkillType[] = []
  if (state.armed === 'bomb') {
    const blast = blasted(next.board, next.gems, piece)
    freed.push(...blast.freed)
    next = { ...next, board: blast.board, gems: blast.gems, score: next.score + points(state, BOMB_POINTS_PER_CELL * blast.cleared * state.level) }
  } else if (state.armed === 'slow') next = { ...next, slowUntil: now + SLOW_MS }

  // A laser takes every row the piece landed on, full or not.
  const rows =
    state.armed === 'laser'
      ? [...new Set([...fullRows(next.board), ...cellsOf(piece).map(([r]) => r)])].sort((a, b) => a - b)
      : fullRows(next.board)
  for (const r of rows) for (const gem of next.gems[r]) if (gem) freed.push(gem)
  next = { ...next, skills: [...next.skills, ...freed].slice(0, MAX_SKILLS) }
  if (state.armed)
    next = {
      ...next,
      skillFx: { id: (state.skillFx?.id ?? 0) + 1, skill: state.armed, cells: cellsOf(piece), rows: state.armed === 'laser' ? rows : [] },
    }
  if (rows.length === 0) return spawnNext(next, now)
  const lines = state.lines + rows.length
  return {
    ...next,
    clearing: rows,
    score: next.score + points(state, LINE_CLEAR_POINTS[rows.length] * state.level),
    lines,
    level: levelFor(state.config.startLevel, lines, survivedMs(state, now)),
    tetrises: state.tetrises + (rows.length === 4 ? 1 : 0),
  }
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'reset':
      return initial(action.config)
    case 'start':
      if (state.status !== 'idle') return state
      return spawnNext({ ...state, status: 'running', startedAt: action.now }, action.now)
    case 'toggle-pause':
      if (state.status === 'running') return { ...state, status: 'paused', pausedAt: action.now }
      if (state.status === 'paused') {
        const paused = action.now - (state.pausedAt ?? action.now)
        return {
          ...state,
          status: 'running',
          pausedMs: state.pausedMs + paused,
          pausedAt: null,
          slowUntil: state.slowUntil === null ? null : state.slowUntil + paused,
        }
      }
      return state
    case 'collapse':
      if (state.clearing.length === 0) return state
      return spawnNext(
        { ...state, board: withoutRows(state.board, state.clearing), gems: withoutRows(state.gems, state.clearing), clearing: [] },
        action.now,
      )
  }

  // Everything else moves the falling piece.
  const { piece } = state
  if (state.status !== 'running' || !piece) return state
  switch (action.type) {
    case 'move': {
      const next = shifted(state.board, piece, action.dx, 0)
      return next ? { ...state, piece: next } : state
    }
    case 'rotate': {
      const next = rotated(state.board, piece, action.dir)
      return next ? { ...state, piece: next } : state
    }
    case 'soft-drop': {
      const next = shifted(state.board, piece, 0, 1)
      return next ? { ...state, piece: next, score: state.score + points(state, SOFT_DROP_POINTS) } : state
    }
    case 'hard-drop': {
      const landed = dropped(state.board, piece)
      return lock(state, landed, (landed.y - piece.y) * HARD_DROP_POINTS, action.now)
    }
    case 'tick': {
      // Surviving long enough levels up, even without clearing lines.
      const level = Math.max(state.level, levelFor(state.config.startLevel, state.lines, survivedMs(state, action.now)))
      const leveled = level === state.level ? state : { ...state, level }
      const next = shifted(state.board, piece, 0, 1)
      return next ? { ...leveled, piece: next } : lock(leveled, piece, 0, action.now)
    }
    case 'hold': {
      if (!state.canHold) return state
      const holdGem = piece.gem ?? null
      if (state.hold === null) return { ...spawnNext({ ...state, hold: piece.type, holdGem }, Date.now()), canHold: false }
      const swapped = spawn(state.hold, state.holdGem ?? undefined)
      if (collides(state.board, swapped)) return state
      return { ...state, piece: swapped, hold: piece.type, holdGem, canHold: false }
    }
    case 'use-skill': {
      if (state.armed || state.skills.length === 0) return state
      const [armed, ...skills] = state.skills
      return { ...state, armed, skills }
    }
  }
  return state
}

const elapsedOf = (s: GameState, now: number) => survivedMs(s, s.endedAt ?? s.pausedAt ?? now)

/** Keys that start a fresh game rather than being ignored before it begins. */
const PLAY_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'z', 'x', 'c', 'v', 'Enter'])

/**
 * A game of Tetris: a 10×20 board, a 7-bag queue, hold, ghost, wall kicks and guideline scoring.
 * Gravity speeds up every 10 lines. Keys come in through onKeyDown; the finished game becomes
 * `result` and counts toward the local best for its start level.
 */
export function useTetris() {
  const config = useTetrisStore((s) => s.config)
  const submitBest = useTetrisStore((s) => s.submitBest)
  const [state, dispatch] = useReducer(reducer, config, initial)
  const [result, setResult] = useState<TetrisResult | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const restart = useCallback(() => {
    setResult(null)
    dispatch({ type: 'reset', config: useTetrisStore.getState().config })
  }, [])

  // A new setup starts over, unless a game is under way (the bar is hidden then anyway).
  useEffect(() => {
    setResult(null)
    dispatch({ type: 'reset', config })
  }, [config])

  const { status, level, clearing, slowUntil } = state
  const falling = status === 'running' && clearing.length === 0
  const slowMs = slowUntil === null ? 0 : Math.max(0, slowUntil - now)
  const slowed = slowMs > 0

  // Gravity: one row per tick, faster with each level; Slow stretches it for a while.
  useEffect(() => {
    if (!falling) return
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), gravityMs(level) * (slowed ? SLOW_FACTOR : 1))
    return () => window.clearInterval(id)
  }, [falling, level, slowed])

  // Cleared rows flash, then collapse.
  useEffect(() => {
    if (clearing.length === 0) return
    const id = window.setTimeout(() => dispatch({ type: 'collapse', now: Date.now() }), CLEAR_FLASH_MS)
    return () => window.clearTimeout(id)
  }, [clearing])

  // The clock above the board.
  useEffect(() => {
    if (status !== 'running') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [status])

  // Game over: the result, counted once.
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (status !== 'over') return
    const s = stateRef.current
    const personalBest = submitBest(s.config, s.score, s.lines)
    setResult({
      config: s.config,
      score: s.score,
      lines: s.lines,
      level: s.level,
      tetrises: s.tetrises,
      pieces: s.pieces,
      seconds: elapsedOf(s, Date.now()) / 1000,
      personalBest,
    })
  }, [status, submitBest])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const s = stateRef.current
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === 'Tab') {
        e.preventDefault()
        restart()
        return
      }
      if (key === 'p') {
        dispatch({ type: 'toggle-pause', now: Date.now() })
        return
      }
      if (s.status === 'idle') {
        if (PLAY_KEYS.has(key)) {
          e.preventDefault()
          dispatch({ type: 'start', now: Date.now() })
        }
        return
      }
      if (s.status === 'paused' && key === ' ') {
        e.preventDefault()
        dispatch({ type: 'toggle-pause', now: Date.now() })
        return
      }
      switch (key) {
        case 'ArrowLeft':
          dispatch({ type: 'move', dx: -1 })
          break
        case 'ArrowRight':
          dispatch({ type: 'move', dx: 1 })
          break
        case 'ArrowDown':
          dispatch({ type: 'soft-drop' })
          break
        case 'ArrowUp':
        case 'x':
          if (!e.repeat) dispatch({ type: 'rotate', dir: 1 })
          break
        case 'z':
          if (!e.repeat) dispatch({ type: 'rotate', dir: -1 })
          break
        case ' ':
          if (!e.repeat) dispatch({ type: 'hard-drop', now: Date.now() })
          break
        case 'c':
        case 'Shift':
          dispatch({ type: 'hold' })
          break
        case 'v':
          if (!e.repeat) dispatch({ type: 'use-skill' })
          break
        default:
          return
      }
      e.preventDefault()
    },
    [restart],
  )

  return {
    ...state,
    config,
    seconds: Math.floor(elapsedOf(state, now) / 1000),
    /** Whole seconds of Slow left; 0 when it isn't running. */
    slowLeft: Math.ceil(slowMs / 1000),
    result,
    restart,
    togglePause: () => dispatch({ type: 'toggle-pause', now: Date.now() }),
    onKeyDown,
  }
}
