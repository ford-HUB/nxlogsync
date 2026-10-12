import { RUNNER_BOX, STAGE } from '@/constants/run-yourself'
import {
  ROOM_ATTEMPTS,
  ROOM_BUFFER,
  ROOM_CEILING,
  ROOM_CLEAR_SECONDS,
  ROOM_COYOTE,
  ROOM_DEATH_SECONDS,
  ROOM_GRAVITY,
  ROOM_JUMP,
  ROOM_LEVELS,
  ROOM_MAX_FALL,
  ROOM_PIT,
  ROOM_POINTS,
  ROOM_WALK,
  ROOM_WALL,
} from '@/constants/run-rooms'
import type { PassOrFallProgress, PlacedPiece, RoomLevel, RoomMove, RoomRunner, RoomState, RoomTrap, StageVec } from '@/types/run-rooms'

const HALF = RUNNER_BOX.width / 2
const TALL = RUNNER_BOX.height
/** Physics runs in steps no longer than this, so a fall never passes through a thin block. */
const SUBSTEP = 1 / 120
/** Hazards forgive this many units of overlap, so a graze isn't a death. */
const HAZARD_GRACE = 4

const easeInOut = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)

/** Where a sprung trap has moved its pieces `since` seconds after it sprang, and whether it's winding up or on the move. */
function trapOffset(trap: RoomTrap, since: number): StageVec & { shaking: boolean; moving: boolean } {
  let from: StageVec = { x: 0, y: 0 }
  let clock = since
  for (const step of trap.steps) {
    const wait = step.wait ?? 0
    if (clock < wait) return { ...from, shaking: true, moving: false }
    clock -= wait
    if (clock < step.seconds) {
      const k = easeInOut(clock / step.seconds)
      return { x: from.x + (step.to.x - from.x) * k, y: from.y + (step.to.y - from.y) * k, shaking: false, moving: true }
    }
    clock -= step.seconds
    from = step.to
  }
  return { ...from, shaking: false, moving: false }
}

/** Every piece of the room where it is at time `t`, with its swing and any sprung traps applied. */
export function placePieces(level: RoomLevel, t: number, sprung: Record<string, number>): PlacedPiece[] {
  return level.pieces.map((piece) => {
    let x = piece.x
    let y = piece.y
    let shaking = false
    let moving = false
    if (piece.swing) {
      const out = (1 - Math.cos((2 * Math.PI * t) / piece.swing.seconds)) / 2
      x += piece.swing.x * out
      y += piece.swing.y * out
    }
    for (const trap of level.traps) {
      const at = sprung[trap.id]
      if (at === undefined || !trap.pieces.includes(piece.id)) continue
      const offset = trapOffset(trap, t - at)
      x += offset.x
      y += offset.y
      shaking ||= offset.shaking
      moving ||= offset.moving
    }
    return { ...piece, x, y, shaking, moving }
  })
}

const solid = (p: PlacedPiece) => p.kind === 'floor' || p.kind === 'block'

/** The runner's box overlaps the piece's (strictly, so standing on top isn't touching), less a margin. */
function overlaps(r: RoomRunner, p: PlacedPiece, margin = 0) {
  return (
    r.x + HALF - margin > p.x && r.x - HALF + margin < p.x + p.w && r.y + TALL - margin > p.y && r.y + margin < p.y + p.h
  )
}

/** Feet at the piece's top (within rounding, as a moving piece leaves them): standing, not walking into it. */
const onTop = (r: RoomRunner, p: PlacedPiece) => r.y > p.y + p.h - 2

const freshRunner = (level: RoomLevel): RoomRunner => ({
  x: level.start,
  y: 0,
  vy: 0,
  grounded: true,
  facing: 1,
  stride: 0,
  coyote: 0,
  buffer: 0,
})

/** Left and right are swapped: a flip trap has sprung in this attempt. */
export const roomFlipped = (s: RoomState) => ROOM_LEVELS[s.level].traps.some((t) => t.flip && s.sprung[t.id] !== undefined)

/** Out of the last door with attempts to spare, rather than out of attempts. */
export const roomEscaped = (s: RoomState) => s.deaths < ROOM_ATTEMPTS

/** A new game, or one continued from saved progress: that room, with its banked points and time. */
export function createRoomRun(from?: PassOrFallProgress | null): RoomState {
  const level = from ? Math.min(ROOM_LEVELS.length - 1, Math.max(0, from.level)) : 0
  return {
    status: 'idle',
    level,
    t: 0,
    elapsed: from?.seconds ?? 0,
    phaseFor: 0,
    runner: freshRunner(ROOM_LEVELS[level]),
    sprung: {},
    held: { left: false, right: false },
    points: from?.points ?? 0,
    lastPoints: 0,
    deaths: 0,
    roomDeaths: 0,
  }
}

/** The room from the top: runner back at the start, traps reset. */
function enterRoom(s: RoomState, level: number) {
  s.level = level
  s.t = 0
  s.phaseFor = 0
  s.death = undefined
  s.status = 'playing'
  s.runner = freshRunner(ROOM_LEVELS[level])
  s.sprung = {}
}

/** A key went down or up. Any key starts an idle game; a held direction keeps walking. */
export function holdMove(state: RoomState, move: RoomMove | undefined, down: boolean): RoomState {
  if (state.status === 'finished') return state
  const s = { ...state, held: { ...state.held }, runner: { ...state.runner } }
  if (s.status === 'idle' && down) s.status = 'playing'
  if (move === 'left' || move === 'right') s.held[move] = down
  else if (move === 'jump' && down) s.runner.buffer = ROOM_BUFFER
  return s
}

function die(s: RoomState, death: 'fall' | 'hit') {
  s.status = 'dying'
  s.death = death
  s.phaseFor = 0
  s.deaths += 1
  s.roomDeaths += 1
  if (death === 'hit') s.runner.vy = 0
}

function clearRoom(s: RoomState) {
  s.status = 'cleared'
  s.phaseFor = 0
  s.lastPoints = Math.max(ROOM_POINTS.min, ROOM_POINTS.clear - s.roomDeaths * ROOM_POINTS.perDeath)
  s.points += s.lastPoints
  s.roomDeaths = 0
}

function springTraps(s: RoomState, level: RoomLevel) {
  const r = s.runner
  for (const trap of level.traps) {
    if (s.sprung[trap.id] !== undefined) continue
    const w = trap.when
    if (w.after && s.sprung[w.after] === undefined) continue
    if (w.from !== undefined && r.x < w.from) continue
    if (w.to !== undefined && r.x > w.to) continue
    if (w.standingOn && r.on !== w.standingOn) continue
    if (w.airborne && r.grounded) continue
    s.sprung[trap.id] = s.t
  }
}

/** One short physics step of a room being played. */
function substep(s: RoomState, level: RoomLevel, dt: number) {
  const before = placePieces(level, s.t, s.sprung)
  s.t += dt
  s.elapsed += dt
  const pieces = placePieces(level, s.t, s.sprung)
  const r = s.runner

  // Whatever it stands on carries it along.
  if (r.on) {
    const was = before.find((p) => p.id === r.on)
    const now = pieces.find((p) => p.id === r.on)
    if (was && now) {
      r.x += now.x - was.x
      r.y += now.y - was.y
    }
  }

  const dir = ((s.held.right ? 1 : 0) - (s.held.left ? 1 : 0)) * (roomFlipped(s) ? -1 : 1)
  if (dir) r.facing = dir > 0 ? 1 : -1
  r.coyote = r.grounded ? ROOM_COYOTE : Math.max(0, r.coyote - dt)
  r.buffer = Math.max(0, r.buffer - dt)
  if (r.buffer > 0 && r.coyote > 0) {
    r.vy = ROOM_JUMP
    r.buffer = 0
    r.coyote = 0
    r.grounded = false
    r.on = undefined
  }
  r.vy = Math.max(-ROOM_MAX_FALL, r.vy - ROOM_GRAVITY * dt)

  // Across, stopped by the sides of blocks and the room's walls.
  const dx = dir * ROOM_WALK * dt
  r.x += dx
  if (r.grounded) r.stride += Math.abs(dx)
  for (const p of pieces) {
    if (!solid(p) || !overlaps(r, p) || onTop(r, p)) continue
    r.x = dx > 0 ? p.x - HALF : dx < 0 ? p.x + p.w + HALF : r.x
  }
  r.x = Math.min(STAGE.width - ROOM_WALL - HALF, Math.max(ROOM_WALL + HALF, r.x))

  // Up and down: land on whatever the feet were above, bump the head on whatever they were below.
  r.y += r.vy * dt
  r.grounded = false
  r.on = undefined
  for (const p of pieces) {
    if (!solid(p) || !overlaps(r, p)) continue
    if (r.vy <= 0 && r.y >= p.y + p.h / 2) {
      r.y = p.y + p.h
      r.vy = 0
      r.grounded = true
      r.on = p.id
    } else if (r.vy > 0) {
      r.y = p.y - TALL
      r.vy = 0
    }
  }
  if (r.y + TALL > ROOM_CEILING) {
    r.y = ROOM_CEILING - TALL
    r.vy = Math.min(0, r.vy)
  }
  // A block that moved into its side pushes it out the short way.
  for (const p of pieces) {
    if (!solid(p) || !overlaps(r, p) || onTop(r, p)) continue
    r.x = r.x < p.x + p.w / 2 ? p.x - HALF : p.x + p.w + HALF
  }

  if (r.y < ROOM_PIT) return die(s, 'fall')
  if (pieces.some((p) => (p.kind === 'rocks' || p.kind === 'crusher') && overlaps(r, p, HAZARD_GRACE))) return die(s, 'hit')
  const door = pieces.find((p) => p.kind === 'door')
  // A door on the move can't be caught.
  if (door && !door.moving && r.grounded && r.x > door.x && r.x < door.x + door.w && Math.abs(r.y - door.y) < 2) return clearRoom(s)

  springTraps(s, level)
}

/**
 * Advances the game by dt seconds: the room being played, a death playing out (then the room again,
 * or the end once the attempts are spent), or a cleared room's pause.
 */
export function stepRoom(state: RoomState, dt: number): RoomState {
  if (state.status === 'idle' || state.status === 'finished') return state
  const s: RoomState = { ...state, runner: { ...state.runner }, sprung: { ...state.sprung } }

  if (s.status === 'dying') {
    s.phaseFor += dt
    s.elapsed += dt
    // A fall keeps falling out of view; a hit drops where it stands.
    if (s.death === 'fall') {
      s.runner.vy = Math.max(-ROOM_MAX_FALL, s.runner.vy - ROOM_GRAVITY * dt)
      s.runner.y += s.runner.vy * dt
    }
    if (s.phaseFor >= ROOM_DEATH_SECONDS) {
      if (s.deaths >= ROOM_ATTEMPTS) s.status = 'finished'
      else enterRoom(s, s.level)
    }
    return s
  }

  if (s.status === 'cleared') {
    s.phaseFor += dt
    s.elapsed += dt
    if (s.phaseFor >= ROOM_CLEAR_SECONDS) {
      if (s.level + 1 >= ROOM_LEVELS.length) s.status = 'finished'
      else enterRoom(s, s.level + 1)
    }
    return s
  }

  const level = ROOM_LEVELS[s.level]
  let left = dt
  while (left > 0 && s.status === 'playing') {
    const step = Math.min(SUBSTEP, left)
    substep(s, level, step)
    left -= step
  }
  return s
}
