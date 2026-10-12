import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  ARR_MS,
  B2B_MULTIPLIER,
  BOMB_POINTS_PER_CELL,
  CLEAR_FLASH_MS,
  COMBO_POINTS,
  DAS_MS,
  HARD_DROP_POINTS,
  LINE_CLEAR_POINTS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  MAX_SKILLS,
  NEXT_PREVIEW,
  SLOW_FACTOR,
  SLOW_MS,
  SOFT_DROP_MS,
  SOFT_DROP_POINTS,
  START_KEY,
  T_SPIN_MINI_POINTS,
  T_SPIN_POINTS,
} from '@/constants/tetris'
import { actionsByKey, normalizeKey } from '@/lib/tetris-keys'
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
  tSpinOf,
  withoutRows,
} from '@/lib/tetris-engine'
import { useTetrisStore } from '@/store/tetris-store'
import type {
  ActivePiece,
  Board,
  ClearCallout,
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
  /** When the grounded piece locks; null while it is still falling. */
  lockAt: number | null
  /** Moves and turns that restarted the lock delay since the piece last reached a lower row. */
  lockResets: number
  /** The lowest row the piece has reached, so dropping further gives it fresh resets. */
  lowestY: number
  /** The kick of the turn that was the piece's last move (for T-spins); null after any other move. */
  lastKick: number | null
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
  tSpins: number
  /** The last line clear was a Tetris or T-spin, so the next one scores back-to-back. */
  b2b: boolean
  /** Pieces in a row that cleared lines, minus one; -1 after a piece that cleared none. */
  combo: number
  maxCombo: number
  /** The last notable clear, for the board's callout. */
  callout: ClearCallout | null
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
  | { type: 'move'; dx: number; now: number }
  | { type: 'rotate'; dir: 1 | -1; now: number }
  | { type: 'soft-drop'; now: number }
  | { type: 'hard-drop'; now: number }
  | { type: 'hold'; now: number }
  | { type: 'use-skill' }
  | { type: 'tick'; now: number }
  | { type: 'lock'; now: number }
  | { type: 'collapse'; now: number }
  | { type: 'toggle-pause'; now: number }

const topUp = (queue: PieceType[]) => (queue.length > NEXT_PREVIEW ? queue : [...queue, ...newBag()])

function initial(config: TetrisConfig): GameState {
  return {
    config,
    board: emptyBoard(),
    gems: emptyGems(),
    piece: null,
    lockAt: null,
    lockResets: 0,
    lowestY: 0,
    lastKick: null,
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
    tSpins: 0,
    b2b: false,
    combo: -1,
    maxCombo: 0,
    callout: null,
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
  return { ...state, ...fresh(piece), queue: topUp(rest), canHold: true }
}

/** A newly spawned (or swapped-in) piece, with its lock delay not yet started. */
const fresh = (piece: ActivePiece) => ({ piece, lockAt: null, lockResets: 0, lowestY: piece.y, lastKick: null })

const grounded = (board: Board, piece: ActivePiece) => shifted(board, piece, 0, 1) === null

/**
 * The falling piece in its new place, and its lock delay: started when it lands, restarted by
 * each move or turn on the ground (MAX_LOCK_RESETS times, then no more until it drops lower),
 * cancelled when it slides off an edge and falls again.
 */
function settle(state: GameState, piece: ActivePiece, now: number): GameState {
  const deeper = piece.y > state.lowestY
  const next = { ...state, piece, lastKick: null, lowestY: Math.max(state.lowestY, piece.y), lockResets: deeper ? 0 : state.lockResets }
  if (!grounded(state.board, piece)) return { ...next, lockAt: null }
  if (deeper) return { ...next, lockAt: now + LOCK_DELAY_MS }
  if (next.lockResets < MAX_LOCK_RESETS) return { ...next, lockAt: now + LOCK_DELAY_MS, lockResets: next.lockResets + 1 }
  return { ...next, lockAt: state.lockAt ?? now }
}

const survivedMs = (s: GameState, now: number) => (s.startedAt === null ? 0 : now - s.startedAt - s.pausedMs)

/** Points earned, with the start level's bonus. */
const points = (s: GameState, base: number) => Math.round(base * startMultiplier(s.config.startLevel))

const T_SPIN_NAMES = ['', ' single', ' double', ' triple']

/**
 * What a locked piece's clear scores, guideline style: line or T-spin points times the level,
 * ×1.5 back-to-back for a Tetris or T-spin clear after another, plus 50 × combo × level for each
 * piece in a row that clears lines. Also the B2B and combo state after it, and the callout.
 */
function scoreClear(state: GameState, piece: ActivePiece, lines: number) {
  const tSpin = state.lastKick === null ? null : tSpinOf(state.board, piece, state.lastKick)
  const base = tSpin
    ? ((tSpin === 'full' ? T_SPIN_POINTS : T_SPIN_MINI_POINTS)[lines] ?? T_SPIN_POINTS[lines])
    : LINE_CLEAR_POINTS[lines]
  const difficult = lines > 0 && (lines === 4 || tSpin !== null)
  const b2b = difficult && state.b2b
  const combo = lines > 0 ? state.combo + 1 : -1
  const earned = points(state, base * state.level * (b2b ? B2B_MULTIPLIER : 1) + (combo > 0 ? COMBO_POINTS * combo * state.level : 0))
  const title = tSpin ? `${tSpin === 'mini' ? 'mini ' : ''}T-spin${T_SPIN_NAMES[lines]}` : lines === 4 ? 'Tetris' : null
  const callout: ClearCallout | null =
    title || b2b || combo > 0 ? { id: (state.callout?.id ?? 0) + 1, title, b2b, combo: Math.max(0, combo), points: earned } : state.callout
  return {
    score: state.score + earned,
    // A T-spin without lines keeps the chain; a plain line clear breaks it.
    b2b: lines > 0 ? difficult : state.b2b,
    combo,
    maxCombo: Math.max(state.maxCombo, combo),
    tSpins: state.tSpins + (tSpin && lines > 0 ? 1 : 0),
    callout,
  }
}

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
    lockAt: null,
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
  next = { ...next, skills: [...next.skills, ...freed].slice(0, MAX_SKILLS), ...scoreClear(next, piece, rows.length) }
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
          lockAt: state.lockAt === null ? null : state.lockAt + paused,
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
      return next ? settle(state, next, action.now) : state
    }
    case 'rotate': {
      const turned = rotated(state.board, piece, action.dir)
      return turned ? { ...settle(state, turned.piece, action.now), lastKick: turned.kick } : state
    }
    case 'soft-drop': {
      const next = shifted(state.board, piece, 0, 1)
      return next ? { ...settle(state, next, action.now), score: state.score + points(state, SOFT_DROP_POINTS) } : state
    }
    case 'hard-drop': {
      const landed = dropped(state.board, piece)
      // Dropping any distance means the last move wasn't the turn, so no T-spin.
      const moved = landed.y === piece.y ? state : { ...state, lastKick: null }
      return lock(moved, landed, (landed.y - piece.y) * HARD_DROP_POINTS, action.now)
    }
    case 'tick': {
      // Surviving long enough levels up, even without clearing lines.
      const level = Math.max(state.level, levelFor(state.config.startLevel, state.lines, survivedMs(state, action.now)))
      const leveled = level === state.level ? state : { ...state, level }
      const next = shifted(state.board, piece, 0, 1)
      if (next) return settle(leveled, next, action.now)
      // On the ground: the lock delay decides when it locks, not gravity.
      if (leveled.lockAt === null) return { ...leveled, lockAt: action.now + LOCK_DELAY_MS }
      return action.now >= leveled.lockAt ? lock(leveled, piece, 0, action.now) : leveled
    }
    case 'lock': {
      // Timers can fire a hair early; a few ms either way doesn't matter.
      if (state.lockAt === null || action.now + 5 < state.lockAt) return state
      return grounded(state.board, piece) ? lock(state, piece, 0, action.now) : { ...state, lockAt: null }
    }
    case 'hold': {
      if (!state.canHold) return state
      const holdGem = piece.gem ?? null
      if (state.hold === null) return { ...spawnNext({ ...state, hold: piece.type, holdGem }, action.now), canHold: false }
      const swapped = spawn(state.hold, state.holdGem ?? undefined)
      if (collides(state.board, swapped)) return state
      return { ...state, ...fresh(swapped), hold: piece.type, holdGem, canHold: false }
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

/**
 * A game of Tetris: a 10×20 board, a 7-bag queue, hold, ghost, wall kicks, lock delay, DAS and guideline scoring.
 * Gravity speeds up every 10 lines. Keys come in through onKeyDown; the finished game becomes
 * `result` and counts toward the local best for its start level.
 */
export function useTetris() {
  const config = useTetrisStore((s) => s.config)
  const submitBest = useTetrisStore((s) => s.submitBest)
  const keys = useTetrisStore((s) => s.keys)
  const keyActions = useMemo(() => actionsByKey(keys), [keys])
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

  const { status, level, clearing, slowUntil, lockAt, pieces } = state
  const falling = status === 'running' && clearing.length === 0
  const slowMs = slowUntil === null ? 0 : Math.max(0, slowUntil - now)
  const slowed = slowMs > 0

  // Gravity: one row per tick, faster with each level; Slow stretches it for a while. Restarted for
  // each piece, so a new one always gets a full tick before its first drop.
  useEffect(() => {
    if (!falling) return
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), gravityMs(level) * (slowed ? SLOW_FACTOR : 1))
    return () => window.clearInterval(id)
  }, [falling, level, slowed, pieces])

  // A grounded piece locks once its lock delay runs out.
  useEffect(() => {
    if (!falling || lockAt === null) return
    const id = window.setTimeout(() => dispatch({ type: 'lock', now: Date.now() }), Math.max(0, lockAt - Date.now()))
    return () => window.clearTimeout(id)
  }, [falling, lockAt])

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
      tSpins: s.tSpins,
      maxCombo: Math.max(0, s.maxCombo),
      pieces: s.pieces,
      seconds: elapsedOf(s, Date.now()) / 1000,
      personalBest,
    })
  }, [status, submitBest])

  // Held arrows repeat on the game's own timing (DAS/ARR), not the system's slow key repeat.
  const repeatRef = useRef<{ key: string; timeout: number; interval: number } | null>(null)
  const stopRepeat = useCallback((key?: string) => {
    const r = repeatRef.current
    if (!r || (key !== undefined && r.key !== key)) return
    window.clearTimeout(r.timeout)
    window.clearInterval(r.interval)
    repeatRef.current = null
  }, [])
  const startRepeat = useCallback(
    (key: string, step: () => void, delay: number, every: number) => {
      stopRepeat()
      step()
      const r = { key, timeout: 0, interval: 0 }
      r.timeout = window.setTimeout(() => {
        r.interval = window.setInterval(step, every)
      }, delay)
      repeatRef.current = r
    },
    [stopRepeat],
  )
  useEffect(() => {
    if (status !== 'running') stopRepeat()
  }, [status, stopRepeat])
  useEffect(() => () => stopRepeat(), [stopRepeat])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const s = stateRef.current
      const key = normalizeKey(e.key)
      const action = keyActions.get(key)
      if (action === 'restart') {
        e.preventDefault()
        restart()
        return
      }
      if (action === 'pause') {
        e.preventDefault()
        if (!e.repeat) dispatch({ type: 'toggle-pause', now: Date.now() })
        return
      }
      if (s.status === 'idle') {
        if (action || key === START_KEY) {
          e.preventDefault()
          dispatch({ type: 'start', now: Date.now() })
        }
        return
      }
      if (s.status === 'paused' && action === 'hardDrop') {
        e.preventDefault()
        dispatch({ type: 'toggle-pause', now: Date.now() })
        return
      }
      if (!action) return
      e.preventDefault()
      if (e.repeat) return
      switch (action) {
        case 'left':
        case 'right': {
          const dx = action === 'left' ? -1 : 1
          startRepeat(key, () => dispatch({ type: 'move', dx, now: Date.now() }), DAS_MS, ARR_MS)
          break
        }
        case 'softDrop':
          startRepeat(key, () => dispatch({ type: 'soft-drop', now: Date.now() }), SOFT_DROP_MS, SOFT_DROP_MS)
          break
        case 'rotateCw':
        case 'rotateCcw':
          dispatch({ type: 'rotate', dir: action === 'rotateCw' ? 1 : -1, now: Date.now() })
          break
        case 'hardDrop':
          dispatch({ type: 'hard-drop', now: Date.now() })
          break
        case 'hold':
          dispatch({ type: 'hold', now: Date.now() })
          break
        case 'skill':
          dispatch({ type: 'use-skill' })
          break
      }
    },
    [keyActions, restart, startRepeat],
  )

  /** Letting go of a held move key stops its repeat. */
  const onKeyUp = useCallback((e: KeyboardEvent) => stopRepeat(normalizeKey(e.key)), [stopRepeat])

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
    onKeyUp,
  }
}
