import type { KnockoutBy, ObstacleKind, RunAction, RunConfig, RunLeaderboardEntry, SkillKind } from '@/types/run-yourself'

/** Where a speed run's finish line is; the clock counts up from 0 until it's crossed. */
export const SPEED_RUN_METRES = 1000
export const DEFAULT_RUN_CONFIG: RunConfig = { mode: 'speed-run' }

/** The stage is a 1000 × 300 unit strip; the runner's feet stand on GROUND_Y at RUNNER_X. */
export const STAGE = { width: 1000, height: 300 } as const
export const GROUND_Y = 252
export const RUNNER_X = 170
/** The runner's hitbox: width, and height standing or sliding. */
export const RUNNER_BOX = { width: 34, height: 80, slideHeight: 40 } as const
/**
 * Sprite frames are trimmed to one 276 × 256 box (of the pack's 512 squares) that fits every
 * pose, so they all share the feet at (141, 219); drawn at this many stage units.
 */
export const FRAME = { width: 135, height: 125 } as const
export const FRAME_FOOT = { x: 141 / 276, y: 219 / 256 } as const

/** Units per second: where a run starts, how it builds, and where it tops out. */
export const SPEED = { start: 330, perSecond: 5, perClear: 6, max: 920 } as const
/** A speed run crash keeps this share of the speed. */
export const CRASH_SPEED_KEEP = 0.65

export const GRAVITY = 2100
export const JUMP_RISE = 700
/** Seconds each move lasts. */
/** Before a run: 3, 2, 1, each this long, then GO. */
export const COUNTDOWN = { steps: 3, stepSeconds: 0.7 } as const
export const MOVE_SECONDS = { slide: 0.9, punch: 0.3, kick: 0.42, stumble: 0.5, fall: 1.1 } as const

/**
 * Punches and kicks only land in their active window (seconds into the move) and within reach of
 * the runner's feet; one that hits nothing leaves the runner open for `whiff` seconds, so mashing
 * gets you knocked out. Reach is where the drawn fist or foot meets an enemy's body, so a hit only
 * counts when it visibly connects. A kick reaches a little further but comes out later. Fire fists
 * add `fireReach`.
 */
export const STRIKES: Record<'punch' | 'kick', { from: number; to: number; reach: number }> = {
  punch: { from: 0.04, to: 0.2, reach: 72 },
  kick: { from: 0.08, to: 0.26, reach: 78 },
}
export const FIRE_REACH = 45
/** A punch or kick pressed this close to the runner being free again comes out the moment it is. */
export const STRIKE_BUFFER_SECONDS = 0.12
/** A slide sweeps an enemy's feet while this far into it, if the enemy is within reach and open. */
export const SWEEP = { seconds: 0.15, reach: 100 } as const
/** A strike into an enemy's guard is blocked, and staggers the runner this long: their punch lands first. */
export const BLOCKED_SECONDS = 0.6

/**
 * Enemies run at the runner on top of the scrolling; at `engage` units they plant and wind up a
 * punch (its length and opening set by DIFFICULTY). `engage` is where the enemy's drawn fist meets
 * the runner's body, so the punch lands exactly as it touches. Knocked down, they're flung back
 * and fade over `downSeconds`.
 */
export const ENEMY = {
  run: 240,
  engage: 62,
  downSeconds: 0.9,
  height: 80,
} as const

/**
 * Further into the course some enemies jump kick instead: they plant at `engage`, crouch, then leap
 * in over the wind-up's open share, landing the kick at `contact` while `peak`-high arcs come down.
 * They start appearing at difficulty `from`, as `chance` of enemies (easy to hard past that). A
 * punch or kick knocks one out of the air while it's open; a slide ducks under it; a sweep can't
 * reach its feet.
 */
export const JUMP_KICK = {
  from: 0.3,
  chance: { easy: 0.25, hard: 0.5 },
  engage: 200,
  contact: 64,
  peak: 70,
  windup: { easy: 1.05, hard: 0.7 },
  opening: 0.55,
} as const
/** Ducking a jump kick: points, times the speed multiplier. */
export const DODGE_POINTS = 100

/** Real seconds each skill lasts once used, and how many charges of one can be held. */
export const SKILL_SECONDS: Record<SkillKind, number> = { fire: 6, slow: 4, phase: 3 }
export const SKILL_MAX_CHARGES = 2
/** Slow motion runs the game at this share of real time. */
export const SLOW_MOTION = 0.4
/** Pickups float this high: on the ground, or at the top of a jump. */
export const PICKUP_LIFTS = [24, 96] as const
export const PICKUP_SIZE = 34

/** Hitbox per obstacle; a block floats `lift` above the ground, so sliding fits under it. */
export const OBSTACLES: Record<ObstacleKind, { width: number; height: number; lift: number; action: RunAction }> = {
  rocks: { width: 80, height: 40, lift: 0, action: 'jump' },
  block: { width: 150, height: 120, lift: 52, action: 'slide' },
}
/**
 * Easy at the start, hard by the finish line: each setting slides from `easy` to `hard` as the run
 * covers the course (see runDifficulty).
 * - windup: seconds an enemy winds up before its punch lands.
 * - opening: the share at the end of the wind-up where it swings and drops its guard.
 * - gapSeconds: seconds of running between things on the course, so gaps keep pace with the speed.
 * - weights: what comes next on the course; a pickup is extra, now and then, between them.
 * - whiff: seconds a strike that hits no one leaves the runner open.
 */
export const DIFFICULTY = {
  windup: { easy: 0.95, hard: 0.42 },
  opening: { easy: 0.6, hard: 0.4 },
  gapSeconds: { easy: { min: 1.6, max: 2.5 }, hard: { min: 0.9, max: 1.4 } },
  weights: { easy: { rocks: 3, block: 2, enemy: 1 }, hard: { rocks: 2, block: 2, enemy: 4 } },
  whiff: { easy: 0.25, hard: 0.42 },
} as const
/** How sharply it ramps: above 1, the early stretch stays gentle for longer. */
export const DIFFICULTY_CURVE = 1.4
export const PICKUP_CHANCE = 0.3

/** Points per metre run, times the speed multiplier; a cleared obstacle or downed enemy adds its bonus, times it too. */
export const POINTS_PER_METRE = 1
export const CLEAR_POINTS: Record<ObstacleKind, number> = { rocks: 50, block: 50 }
export const KNOCKOUT_POINTS: Record<KnockoutBy, number> = { punch: 150, kick: 150, sweep: 200 }
/** Fire fists add this share to a knockout. */
export const FIRE_BONUS = 0.5
export const PICKUP_POINTS = 25
export const UNITS_PER_METRE = 50
/** How long a burst or "+points" stays on the stage. */
export const EFFECT_SECONDS = 0.6

export const SKILL_LABELS: Record<SkillKind, { name: string; hint: string }> = {
  fire: { name: 'fire fists', hint: 'Punches and kicks reach further and burn' },
  slow: { name: 'slow-mo', hint: 'Everything slows down, so timing is easier' },
  phase: { name: 'phase', hint: 'Pass straight through obstacles and enemies' },
}

export const RUN_LEADERBOARD_SIZE = 25

/**
 * Mock leaderboard players. Design only: there is no Run yourself board on the server yet, so
 * these stand in for other players; the user's own row comes from their local best.
 */
const MOCK_NAMES = [
  'kai.dev', 'mira', 'jonas', 'ana-r', 'theo', 'priya', 'lukas', 'sofia', 'raf', 'nina',
  'omar', 'bea', 'ivan', 'yuki', 'leo', 'dana', 'marco', 'tess', 'eli', 'zoe', 'rico', 'fae',
]

/** Points fall away down the board; a speed run's times climb from about a perfect run's 77s. */
function mockBoard(top: number, seed: number, speedRun: boolean): RunLeaderboardEntry[] {
  return MOCK_NAMES.map((name, i) => {
    const points = Math.round(top * Math.pow(speedRun ? 0.95 : 0.86, i) * (1 - ((i * seed) % 7) / 100))
    const metres = speedRun ? SPEED_RUN_METRES : Math.round(points / (2.4 + (i % 3) * 0.2))
    const seconds = speedRun ? Math.round((80 + i * 3.2 + ((i * seed) % 5)) * 10) / 10 : Math.round(metres / 11)
    return { id: `mock-${seed}-${i}`, name, points, metres, seconds }
  })
}

export const MOCK_RUN_LEADERBOARDS: Record<string, RunLeaderboardEntry[]> = {
  'speed-run': mockBoard(9300, 5, true),
}
