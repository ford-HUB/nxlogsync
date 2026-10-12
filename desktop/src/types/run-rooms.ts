/**
 * What a room is built from: floors and blocks are stood on, rocks and crushers kill, the door
 * ends it. A decoy looks just like the door and goes nowhere.
 */
export type RoomPieceKind = 'floor' | 'block' | 'rocks' | 'crusher' | 'door' | 'decoy'

export interface StageVec {
  x: number
  y: number
}

export interface RoomPiece {
  id: string
  kind: RoomPieceKind
  /** Left edge, bottom's height above the floor line, and size, in stage units, at rest. */
  x: number
  y: number
  w: number
  h: number
  /** Swings out by this much from rest and back again, forever, once every `seconds`. */
  swing?: StageVec & { seconds: number }
}

/** One move of a trap: wait (the pieces shake meanwhile), then glide to `to`, an offset from rest. */
export interface TrapStep {
  to: StageVec
  seconds: number
  wait?: number
}

/** When a trap springs; every condition given must hold. It springs once per attempt. */
export interface TrapTrigger {
  /** The runner's x is between these. */
  from?: number
  to?: number
  /** The runner is standing on this piece. */
  standingOn?: string
  /** The runner is in the air. */
  airborne?: boolean
  /** Only once this other trap has sprung. */
  after?: string
}

export interface RoomTrap {
  id: string
  pieces: string[]
  when: TrapTrigger
  steps: TrapStep[]
  /** Swaps left and right for the rest of the attempt once it springs. */
  flip?: boolean
}

/** One room, one level: get from the start to the door. */
export interface RoomLevel {
  name: string
  /** The runner's x at the start; it starts on the floor. */
  start: number
  pieces: RoomPiece[]
  traps: RoomTrap[]
}

/** A piece where it is right now, with its traps and swing applied. */
export interface PlacedPiece extends RoomPiece {
  /** A trap is about to move it, or is moving it. */
  shaking: boolean
  moving: boolean
}

export type RoomMove = 'left' | 'right' | 'jump'

export interface RoomRunner {
  /** The middle of the feet, and their height above the floor line. */
  x: number
  y: number
  vy: number
  grounded: boolean
  /** The piece it stands on, so a moving block carries it. */
  on?: string
  facing: 1 | -1
  /** Units walked, for the stride. */
  stride: number
  /** Seconds a jump still counts after walking off an edge, and a press still counts before landing. */
  coyote: number
  buffer: number
}

export interface RoomState {
  /** Dying and cleared each play out for a moment before the room restarts or the next one opens. */
  status: 'idle' | 'playing' | 'dying' | 'cleared' | 'finished'
  /** Index into ROOM_LEVELS. */
  level: number
  /** Seconds into this attempt at the room; the swings and traps run on it. */
  t: number
  /** Seconds since the first key, over every room and attempt. */
  elapsed: number
  /** Seconds into dying or cleared. */
  phaseFor: number
  death?: 'fall' | 'hit'
  runner: RoomRunner
  /** Trap id → the room's t when it sprang. */
  sprung: Record<string, number>
  held: { left: boolean; right: boolean }
  points: number
  /** Points the last cleared room was worth. */
  lastPoints: number
  deaths: number
  roomDeaths: number
}

export interface RoomResult {
  points: number
  /** Levels cleared: all of them when it escaped. */
  levels: number
  escaped: boolean
  deaths: number
  seconds: number
  personalBest: boolean
}

/** Where Continue resumes: the furthest room unlocked, and the points and time banked on the way. */
export interface PassOrFallProgress {
  /** ROOM_LEVELS index. */
  level: number
  points: number
  seconds: number
}

export interface PassOrFallLeaderboardEntry {
  id: string
  name: string
  points: number
  levels: number
  seconds: number
  /** The signed-in user's own row. */
  you: boolean
}

/** The top players' best runs, from the server. */
export interface PassOrFallLeaderboard {
  /** Most points first; ties go to the faster run. */
  entries: PassOrFallLeaderboardEntry[]
  /** The signed-in user's best run, on the board or not; null without one. */
  you: { rank: number; points: number; levels: number; seconds: number } | null
}

export interface PassOrFallScoreResult extends PassOrFallLeaderboard {
  personalBest: boolean
}
