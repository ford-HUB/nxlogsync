/** Speed run: race to the finish line, a crash only costs speed. Pass or fall: Level Devil style rooms, see run-rooms. */
export type RunMode = 'speed-run' | 'pass-or-fall'

export interface RunConfig {
  mode: RunMode
}

/** What the runner can do, each bound to a key. Punch and kick hit enemies; a slide sweeps their feet. */
export type RunAction = 'jump' | 'slide' | 'punch' | 'kick'

/**
 * Skills picked up on the run, spent with a key or a click: fire fists (punches and kicks reach
 * further and burn), slow motion, and phasing through obstacles and enemies.
 */
export type SkillKind = 'fire' | 'slow' | 'phase'

/** Rocks are jumped and low blocks slid under; enemies are fought (see RunEnemy). */
export type ObstacleKind = 'rocks' | 'block'

export interface Obstacle {
  id: number
  kind: ObstacleKind
  /** Left edge, in stage units. */
  x: number
  /** Smashed aside by a speed run crash; no longer solid. */
  broken: boolean
  /** Seconds since it was broken, for the break animation. */
  brokenFor: number
  /** Points already counted for getting past it. */
  passed: boolean
}

/** How an enemy went down; a fiery hit leaves flames. */
export type KnockoutBy = 'punch' | 'kick' | 'sweep'

/**
 * A stickman running at the runner from the right. In range it plants and winds up a punch; the
 * runner has until it lands to punch, kick or sweep it down, or is knocked out.
 */
export interface RunEnemy {
  id: number
  /** Where its feet are, in stage units. */
  x: number
  state: 'charging' | 'windup' | 'down'
  /** A punch from where it plants, or (further in) a leaping kick; see JUMP_KICK. */
  attack: 'punch' | 'jump-kick'
  /** Seconds in the current state. */
  stateFor: number
  /** How long this one's wind-up lasts, and the share at its end where it's open, set as it plants. */
  windup: number
  opening: number
  /** Slid under while jump kicking: it lands behind the runner and runs on, out of the fight. */
  dodged?: boolean
  by?: KnockoutBy
  /** Put down while fire fists were burning. */
  burning?: boolean
}

/** A skill floating on the course; running through it adds a charge. */
export interface SkillPickup {
  id: number
  kind: SkillKind
  x: number
  /** Height above the ground. */
  lift: number
}

/** A yellow burst, a "+120", or flames left where something happened; fades on its own. */
export interface RunEffect {
  id: number
  kind: 'burst' | 'points' | 'fire'
  x: number
  /** Height above the ground, in stage units. */
  y: number
  /** Seconds since it appeared. */
  age: number
  points?: number
  /** A word instead of points, e.g. "KO" or "+slow". */
  label?: string
}

export type RunnerPose = 'idle' | 'run' | 'jump' | 'slide' | 'punch' | 'kick' | 'stumble' | 'dead'

export interface RunState {
  /** The first key starts a countdown; the run (and its clock) only begins at GO. */
  status: 'idle' | 'countdown' | 'running' | 'falling' | 'finished'
  /** Real seconds left on the countdown before GO. */
  countdown: number
  config: RunConfig
  /** Game seconds since the run started (slow motion slows the clock too). */
  elapsed: number
  /** Stage units per second. */
  speed: number
  topSpeed: number
  /** Stage units travelled; the ground and skyline scroll with it. */
  distance: number
  points: number
  cleared: number
  crashes: number
  knockouts: number
  /** Knocked out by an enemy's punch: the run is over. */
  knockedOut: boolean
  pose: RunnerPose
  /** Seconds into the current pose (jump, slide, punch, kick, stumble, fall). */
  poseFor: number
  /** Seconds before another punch or kick, after one that hit nothing. */
  recover: number
  /** A punch or kick pressed just before the runner was free, waiting to come out the moment it is. */
  queued: 'punch' | 'kick' | null
  /** Feet above the ground, and the vertical speed while in the air. */
  height: number
  rise: number
  /** Seconds left without crashing again after a stumble. */
  safeFor: number
  obstacles: Obstacle[]
  enemies: RunEnemy[]
  pickups: SkillPickup[]
  /** Charges of each skill. */
  skills: Record<SkillKind, number>
  /** Real seconds left on each skill in use. */
  active: Record<SkillKind, number>
  effects: RunEffect[]
  /** Distance until the next obstacle, enemy or pickup appears at the stage's right edge. */
  nextIn: number
  nextId: number
}

export interface RunResult {
  config: RunConfig
  points: number
  /** Metres covered. */
  metres: number
  cleared: number
  crashes: number
  knockouts: number
  /** Ended by an enemy's punch, short of the finish. */
  knockedOut: boolean
  topSpeed: number
  seconds: number
  personalBest: boolean
}

export interface SpeedRunLeaderboardEntry {
  id: string
  name: string
  points: number
  /** SPEED_RUN_METRES when it finished; less when an enemy knocked it out. */
  metres: number
  /** Seconds to the finish line, or until the knockout. */
  seconds: number
  /** The signed-in user's own row. */
  you: boolean
}

/** The top players' best speed runs, from the server. */
export interface SpeedRunLeaderboard {
  /** Most points first; ties go to the further, then the faster run. */
  entries: SpeedRunLeaderboardEntry[]
  /** The signed-in user's best run, on the board or not; null without one. */
  you: { rank: number; points: number; metres: number; seconds: number } | null
}

export interface SpeedRunScoreResult extends SpeedRunLeaderboard {
  personalBest: boolean
}

export interface RunLeaderboardEntry {
  id: string
  name: string
  points: number
  metres: number
  /** Seconds the run took; a speed run's board shows its finish time. */
  seconds: number
  /** False for a speed run knocked out short of the line: the time column shows its distance instead. */
  finished?: boolean
  you?: boolean
}
