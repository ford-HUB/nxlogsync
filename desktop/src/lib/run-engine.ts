import {
  CLEAR_POINTS,
  COUNTDOWN,
  CRASH_SPEED_KEEP,
  DIFFICULTY,
  DIFFICULTY_CURVE,
  DODGE_POINTS,
  EFFECT_SECONDS,
  ENEMY,
  FIRE_BONUS,
  FIRE_REACH,
  GRAVITY,
  JUMP_KICK,
  JUMP_RISE,
  KNOCKOUT_POINTS,
  MOVE_SECONDS,
  OBSTACLES,
  PICKUP_CHANCE,
  PICKUP_LIFTS,
  PICKUP_POINTS,
  PICKUP_SIZE,
  POINTS_PER_METRE,
  RUNNER_BOX,
  RUNNER_X,
  SKILL_MAX_CHARGES,
  SKILL_SECONDS,
  SLOW_MOTION,
  SPEED,
  SPEED_RUN_METRES,
  STAGE,
  STRIKE_BUFFER_SECONDS,
  STRIKES,
  SWEEP,
  UNITS_PER_METRE,
  BLOCKED_SECONDS,
} from '@/constants/run-yourself'
import type { KnockoutBy, Obstacle, RunAction, RunConfig, RunEffect, RunEnemy, RunState, SkillKind } from '@/types/run-yourself'

const RUNNER_LEFT = RUNNER_X - RUNNER_BOX.width / 2
const RUNNER_RIGHT = RUNNER_X + RUNNER_BOX.width / 2
const SKILLS: SkillKind[] = ['fire', 'slow', 'phase']
/** Moves that run out on their own; the runner then goes back to running (or falling). */
const TIMED_POSES = { slide: MOVE_SECONDS.slide, punch: MOVE_SECONDS.punch, kick: MOVE_SECONDS.kick, stumble: MOVE_SECONDS.stumble }
const NO_SKILLS: Record<SkillKind, number> = { fire: 0, slow: 0, phase: 0 }
/** How fast a downed enemy is flung back at first, easing to nothing over FLING_SECONDS. */
const FLING_SPEED = 520
const FLING_SECONDS = 0.3

type CourseKind = keyof typeof DIFFICULTY.weights.easy

/** Points scale with speed: 1× at the start speed, nearly 3× at the top. */
export const speedMultiplier = (speed: number) => speed / SPEED.start

/**
 * How hard the rocket, speed lines and other effects run, 0.2–1 in steps of 0.1, from the speed.
 * Stepped so the animations aren't restarted on every frame.
 */
export const runBoost = (speed: number) =>
  Math.round(Math.min(1, Math.max(0.2, (speed - SPEED.start) / (SPEED.max - SPEED.start))) * 10) / 10

export const toMetres = (units: number) => Math.floor(units / UNITS_PER_METRE)

/**
 * The board a run counts toward: one per game. Pass or fall became rooms after Level Devil, so its
 * old endless-run bests sit under the old key and don't compete.
 */
export const runBestKey = ({ mode }: RunConfig) => (mode === 'pass-or-fall' ? 'pass-or-fall-rooms' : mode)

/** Stage units from the start to a speed run's finish line. */
export const FINISH_UNITS = SPEED_RUN_METRES * UNITS_PER_METRE

export function createRun(config: RunConfig): RunState {
  return {
    status: 'idle',
    countdown: 0,
    config,
    elapsed: 0,
    speed: SPEED.start,
    topSpeed: SPEED.start,
    distance: 0,
    points: 0,
    cleared: 0,
    crashes: 0,
    knockouts: 0,
    knockedOut: false,
    pose: 'idle',
    poseFor: 0,
    recover: 0,
    queued: null,
    height: 0,
    rise: 0,
    safeFor: 0,
    obstacles: [],
    enemies: [],
    pickups: [],
    skills: { ...NO_SKILLS },
    active: { ...NO_SKILLS },
    effects: [],
    // A clear first stretch before anything comes.
    nextIn: SPEED.start * 1.6,
    nextId: 1,
  }
}

/** 0 at the start line to 1 at the finish, eased so the early stretch stays gentle. */
export const runDifficulty = (s: RunState) => Math.min(1, s.distance / FINISH_UNITS) ** DIFFICULTY_CURVE

/** A setting's value at difficulty `d`, between its easy and hard ends. */
const ramp = ({ easy, hard }: { easy: number; hard: number }, d: number) => easy + (hard - easy) * d

const gapAfter = (s: RunState) => {
  const d = runDifficulty(s)
  const min = ramp({ easy: DIFFICULTY.gapSeconds.easy.min, hard: DIFFICULTY.gapSeconds.hard.min }, d)
  const max = ramp({ easy: DIFFICULTY.gapSeconds.easy.max, hard: DIFFICULTY.gapSeconds.hard.max }, d)
  return s.speed * (min + Math.random() * (max - min))
}

/** Rocks first, so the opening move is the obvious one, then an enemy; after that, by weight for the difficulty. */
function pickNext(s: RunState): CourseKind {
  if (s.nextId === 1) return 'rocks'
  if (s.nextId === 2) return 'enemy'
  const d = runDifficulty(s)
  const kinds = Object.keys(DIFFICULTY.weights.easy) as CourseKind[]
  const weight = (k: CourseKind) => ramp({ easy: DIFFICULTY.weights.easy[k], hard: DIFFICULTY.weights.hard[k] }, d)
  let roll = Math.random() * kinds.reduce((sum, k) => sum + weight(k), 0)
  for (const kind of kinds) {
    roll -= weight(kind)
    if (roll < 0) return kind
  }
  return 'rocks'
}

function addEffect(s: RunState, effect: Omit<RunEffect, 'id' | 'age'>) {
  s.effects.push({ ...effect, id: s.nextId++, age: 0 })
}

/** Counts an obstacle as got past: a bonus scaled by the speed, and a little faster. */
function clear(s: RunState, o: Obstacle) {
  o.passed = true
  const points = Math.round(CLEAR_POINTS[o.kind] * speedMultiplier(s.speed))
  s.points += points
  s.cleared += 1
  s.speed = Math.min(SPEED.max, s.speed + SPEED.perClear)
  addEffect(s, { kind: 'points', x: Math.max(o.x, RUNNER_X), y: OBSTACLES[o.kind].lift + OBSTACLES[o.kind].height + 10, points })
}

/** Puts an enemy down: points by how (more for a sweep, more again on fire), and it's flung back. */
function knockDown(s: RunState, e: RunEnemy, by: KnockoutBy) {
  const burning = s.active.fire > 0 && by !== 'sweep'
  e.state = 'down'
  e.stateFor = 0
  e.by = by
  e.burning = burning
  const points = Math.round(KNOCKOUT_POINTS[by] * (burning ? 1 + FIRE_BONUS : 1) * speedMultiplier(s.speed))
  s.points += points
  s.knockouts += 1
  s.cleared += 1
  s.speed = Math.min(SPEED.max, s.speed + SPEED.perClear)
  addEffect(s, { kind: burning ? 'fire' : 'burst', x: e.x, y: by === 'sweep' ? 20 : 60 })
  addEffect(s, { kind: 'points', x: e.x, y: ENEMY.height + 30, points, label: by === 'sweep' ? 'SWEEP' : 'KO' })
}

/** An enemy's punch landed: the runner drops, and the run is over. */
function knockOut(s: RunState) {
  s.status = 'falling'
  s.knockedOut = true
  s.pose = 'dead'
  s.poseFor = 0
  s.height = 0
  s.rise = 0
  addEffect(s, { kind: 'burst', x: RUNNER_RIGHT, y: 60 })
}

/** Hits an obstacle: the run stumbles on, slower, the obstacle smashed aside. */
function crash(s: RunState, o: Obstacle) {
  s.crashes += 1
  addEffect(s, { kind: 'burst', x: RUNNER_RIGHT, y: 50 })
  s.speed = Math.max(SPEED.start, s.speed * CRASH_SPEED_KEEP)
  s.pose = 'stumble'
  s.poseFor = 0
  s.safeFor = MOVE_SECONDS.stumble + 0.3
  o.broken = true
  o.passed = true
}

/** The first key starts the countdown; the key itself isn't also a move. */
export function startRun(state: RunState): RunState {
  return { ...createRun(state.config), status: 'countdown', countdown: COUNTDOWN.steps * COUNTDOWN.stepSeconds }
}

/** Counts down in place, the runner standing ready; at GO it takes off with a kick of dust. */
function stepCountdown(state: RunState, realDt: number): RunState {
  const s = { ...state, countdown: state.countdown - realDt, poseFor: state.poseFor + realDt }
  s.effects = state.effects.map((e) => ({ ...e, age: e.age + realDt })).filter((e) => e.age < EFFECT_SECONDS)
  if (s.countdown > 0) return s
  s.status = 'running'
  s.countdown = 0
  s.pose = 'run'
  s.poseFor = 0
  s.effects = [...s.effects]
  addEffect(s, { kind: 'burst', x: RUNNER_X - 30, y: 20 })
  addEffect(s, { kind: 'points', x: RUNNER_X + 40, y: RUNNER_BOX.height + 20, label: 'GO!' })
  return s
}

export function pressAction(state: RunState, action: RunAction): RunState {
  const striking = action === 'punch' || action === 'kick'
  if (state.status !== 'running' || (state.pose === 'stumble' && !striking)) return state
  const s = { ...state }
  switch (action) {
    case 'jump':
      if (s.height > 0) return state
      s.queued = null
      s.rise = JUMP_RISE
      s.height = 0.01
      s.pose = 'jump'
      s.poseFor = 0
      break
    case 'slide':
      // In the air it dives back down; already sliding, a press doesn't restart the sweep.
      s.queued = null
      if (s.height > 0) s.rise = -JUMP_RISE
      else if (s.pose !== 'slide') {
        s.pose = 'slide'
        s.poseFor = 0
      }
      break
    case 'punch':
    case 'kick': {
      // Mid-strike, staggered, or open after one that missed: a press just before it's over comes
      // out the moment it is (see stepRun); any earlier, it does nothing.
      const busyFor = Math.max(s.recover, s.pose in TIMED_POSES && s.pose !== 'slide' ? TIMED_POSES[s.pose as keyof typeof TIMED_POSES] - s.poseFor : 0)
      if (busyFor > 0) {
        if (busyFor > STRIKE_BUFFER_SECONDS) return state
        s.queued = action
        break
      }
      s.queued = null
      s.pose = action
      s.poseFor = 0
      break
    }
  }
  return s
}

/** Spends a charge of a skill, if there is one and that skill isn't already running. */
export function activateSkill(state: RunState, skill: SkillKind): RunState {
  if (state.status !== 'running' || state.skills[skill] <= 0 || state.active[skill] > 0) return state
  return {
    ...state,
    skills: { ...state.skills, [skill]: state.skills[skill] - 1 },
    active: { ...state.active, [skill]: SKILL_SECONDS[skill] },
  }
}

/** How far through its leap a jump-kicking enemy is: 0 still crouched, 1 as the kick lands. */
export const leapProgress = (e: RunEnemy) =>
  e.attack === 'jump-kick' && e.state === 'windup'
    ? Math.min(1, Math.max(0, (e.stateFor / e.windup - (1 - e.opening)) / e.opening))
    : 0

/** A jump-kicking enemy's height above the ground: up from the crouch, coming down onto the kick. */
export const enemyLift = (e: RunEnemy) => JUMP_KICK.peak * Math.sin(Math.PI * 0.85 * leapProgress(e))

/** Whether `e` has dropped its guard to swing: the last stretch of its wind-up. Fire fists break any guard. */
const isOpen = (s: RunState, e: RunEnemy) =>
  s.active.fire > 0 || (e.state === 'windup' && e.stateFor >= e.windup * (1 - e.opening))

/** The runner's strike hit a guard: knocked back, too late to strike again before their punch. */
function blocked(s: RunState, e: RunEnemy) {
  s.pose = 'stumble'
  s.poseFor = MOVE_SECONDS.stumble - BLOCKED_SECONDS
  s.recover = BLOCKED_SECONDS
  addEffect(s, { kind: 'points', x: e.x, y: ENEMY.height + 30, label: 'BLOCKED' })
}

/** Slid under a jump kick: it sails over and lands behind, running on off the stage. */
function dodge(s: RunState, e: RunEnemy) {
  e.state = 'charging'
  e.stateFor = 0
  e.dodged = true
  const points = Math.round(DODGE_POINTS * speedMultiplier(s.speed))
  s.points += points
  s.cleared += 1
  addEffect(s, { kind: 'points', x: RUNNER_X, y: RUNNER_BOX.height + 30, points, label: 'DODGE' })
}

/** Whether the runner's strike is in its active window and reaches `e`. */
function strikeLands(s: RunState, e: RunEnemy) {
  if (s.pose !== 'punch' && s.pose !== 'kick') return false
  const strike = STRIKES[s.pose]
  const reach = strike.reach + (s.active.fire > 0 ? FIRE_REACH : 0)
  return s.poseFor >= strike.from && s.poseFor <= strike.to && e.x - RUNNER_X <= reach
}

/**
 * Enemies run in and plant where their fist meets the runner to wind up a punch, guarding until
 * they swing. In that opening, a punch, kick or slide into their feet puts them down; too early is
 * blocked, too late and the punch lands as it touches: the runner is knocked out. Jump kickers
 * plant further off and leap in over the opening: strike them out of the air, or slide under.
 * Phasing, they never plant, and an attack already coming passes through.
 */
function stepEnemies(s: RunState, dt: number, travel: number) {
  const phasing = s.active.phase > 0
  let landed = false
  for (const e of s.enemies) {
    e.stateFor += dt
    if (e.state === 'down') {
      e.x += Math.max(0, 1 - e.stateFor / FLING_SECONDS) * FLING_SPEED * dt - travel
      continue
    }
    if (e.state === 'charging') {
      e.x -= travel + ENEMY.run * dt
      if (e.x <= RUNNER_X || e.dodged) continue
      const kicker = e.attack === 'jump-kick'
      const engage = kicker ? JUMP_KICK.engage : ENEMY.engage
      if (!phasing && e.x - RUNNER_X <= engage) {
        const d = runDifficulty(s)
        e.x = RUNNER_X + engage
        e.state = 'windup'
        e.stateFor = 0
        e.windup = ramp(kicker ? JUMP_KICK.windup : DIFFICULTY.windup, d)
        e.opening = kicker ? JUMP_KICK.opening : ramp(DIFFICULTY.opening, d)
      }
    }
    // A jump kicker closes fast off the crouch and eases in onto the kick.
    if (e.state === 'windup' && e.attack === 'jump-kick') {
      e.x = RUNNER_X + JUMP_KICK.contact + (JUMP_KICK.engage - JUMP_KICK.contact) * (1 - leapProgress(e)) ** 2
    }
    if (phasing || e.dodged) {
      if (e.state === 'windup') e.state = 'charging'
      continue
    }
    if (strikeLands(s, e)) {
      if (!isOpen(s, e)) {
        blocked(s, e)
        landed = true
        continue
      }
      knockDown(s, e, s.pose as 'punch' | 'kick')
      landed = true
    } else if (
      s.pose === 'slide' &&
      s.poseFor <= SWEEP.seconds &&
      e.attack !== 'jump-kick' &&
      e.x - RUNNER_X <= SWEEP.reach &&
      isOpen(s, e)
    ) {
      knockDown(s, e, 'sweep')
    } else if (e.state === 'windup' && e.stateFor >= e.windup) {
      if (e.attack === 'jump-kick' && s.pose === 'slide' && s.height === 0) {
        dodge(s, e)
        continue
      }
      knockOut(s)
      return
    }
  }
  // A strike that comes out of its window having hit no one leaves the runner open.
  if (!landed && (s.pose === 'punch' || s.pose === 'kick') && s.recover === 0) {
    const strike = STRIKES[s.pose]
    const missed = s.poseFor > strike.to && s.poseFor - dt <= strike.to
    if (missed && !s.enemies.some((e) => e.state === 'down' && e.stateFor <= s.poseFor)) {
      s.recover = ramp(DIFFICULTY.whiff, runDifficulty(s)) + MOVE_SECONDS[s.pose] - s.poseFor
    }
  }
  s.enemies = s.enemies.filter((e) => e.x > -150 && (e.state !== 'down' || e.stateFor < ENEMY.downSeconds))
}

/** Pickups scroll with the course; running through one adds a charge of its skill. */
function stepPickups(s: RunState, travel: number) {
  const top = s.height + (s.pose === 'slide' ? RUNNER_BOX.slideHeight : RUNNER_BOX.height)
  s.pickups = s.pickups.filter((p) => {
    p.x -= travel
    const touches =
      Math.abs(p.x - RUNNER_X) <= (PICKUP_SIZE + RUNNER_BOX.width) / 2 &&
      p.lift + PICKUP_SIZE / 2 >= s.height &&
      p.lift - PICKUP_SIZE / 2 <= top
    if (!touches) return p.x > -PICKUP_SIZE
    s.skills = { ...s.skills, [p.kind]: Math.min(SKILL_MAX_CHARGES, s.skills[p.kind] + 1) }
    s.points += PICKUP_POINTS
    addEffect(s, { kind: 'points', x: p.x, y: p.lift + 30, label: `+${p.kind === 'slow' ? 'slow-mo' : p.kind}` })
    return false
  })
}

/** Past JUMP_KICK.from, a growing share of enemies jump kick instead of punching. */
function pickAttack(s: RunState): RunEnemy['attack'] {
  const d = runDifficulty(s)
  if (d < JUMP_KICK.from) return 'punch'
  return Math.random() < ramp(JUMP_KICK.chance, (d - JUMP_KICK.from) / (1 - JUMP_KICK.from)) ? 'jump-kick' : 'punch'
}

/** Something new at the right edge, and now and then a skill pickup partway to the next one. */
function spawn(s: RunState) {
  const kind = pickNext(s)
  const x = STAGE.width + 60
  if (kind === 'enemy') {
    s.enemies.push({ id: s.nextId++, x, state: 'charging', attack: pickAttack(s), stateFor: 0, windup: 0, opening: 0 })
  }
  else s.obstacles.push({ id: s.nextId++, kind, x, broken: false, brokenFor: 0, passed: false })
  // An enemy closes faster than the course scrolls, so it gets a longer gap behind it.
  s.nextIn = gapAfter(s) + (kind === 'enemy' ? s.speed * 0.5 : OBSTACLES[kind].width)
  if (s.nextId > 3 && Math.random() < PICKUP_CHANCE) {
    s.pickups.push({
      id: s.nextId++,
      kind: SKILLS[Math.floor(Math.random() * SKILLS.length)],
      x: x + s.nextIn / 2,
      lift: PICKUP_LIFTS[Math.floor(Math.random() * PICKUP_LIFTS.length)],
    })
  }
}

/**
 * Advances the run by `realDt` seconds: skill timers in real time, everything else in game time
 * (slowed while slow motion runs) — physics, the course, fights, pickups, points and the clock.
 */
export function stepRun(state: RunState, realDt: number): RunState {
  if (state.status === 'idle' || state.status === 'finished') return state
  if (state.status === 'countdown') return stepCountdown(state, realDt)
  const tick = (left: number) => Math.max(0, left - realDt)
  const s: RunState = {
    ...state,
    obstacles: state.obstacles.map((o) => ({ ...o })),
    enemies: state.enemies.map((e) => ({ ...e })),
    pickups: state.pickups.map((p) => ({ ...p })),
    active: { fire: tick(state.active.fire), slow: tick(state.active.slow), phase: tick(state.active.phase) },
  }
  const dt = realDt * (s.active.slow > 0 ? SLOW_MOTION : 1)
  s.effects = state.effects.map((e) => ({ ...e, age: e.age + dt })).filter((e) => e.age < EFFECT_SECONDS)
  s.poseFor += dt

  if (s.status === 'falling') {
    if (s.poseFor >= MOVE_SECONDS.fall) s.status = 'finished'
    return s
  }

  s.elapsed += dt
  s.safeFor = Math.max(0, s.safeFor - dt)
  s.recover = Math.max(0, s.recover - dt)
  s.speed = Math.min(SPEED.max, s.speed + SPEED.perSecond * dt)
  s.topSpeed = Math.max(s.topSpeed, s.speed)
  const travel = s.speed * dt
  s.distance += travel
  s.points += (travel / UNITS_PER_METRE) * POINTS_PER_METRE * speedMultiplier(s.speed)

  // Jumping and landing.
  if (s.height > 0 || s.rise > 0) {
    s.rise -= GRAVITY * dt
    s.height = Math.max(0, s.height + s.rise * dt)
    if (s.height === 0) {
      s.rise = 0
      if (s.pose === 'jump') s.pose = 'run'
    }
  }

  // The course scrolls left; something new comes in at the right edge, except near the finish.
  for (const o of s.obstacles) {
    o.x -= travel
    if (o.broken) o.brokenFor += dt
  }
  s.nextIn -= travel
  const nearFinish = s.config.mode === 'speed-run' && s.distance + STAGE.width > FINISH_UNITS - SPEED.start
  if (s.nextIn <= 0 && !nearFinish) spawn(s)

  stepEnemies(s, dt, travel)
  if (s.status !== 'running') return s
  stepPickups(s, travel)

  // The move runs out after the fights, so a strike's last frame still counts.
  const timed = TIMED_POSES[s.pose as keyof typeof TIMED_POSES]
  if (timed !== undefined && s.poseFor >= timed) {
    s.pose = s.height > 0 ? 'jump' : 'run'
    s.poseFor = 0
  }
  // A strike pressed just before the runner was free comes out now.
  if (s.queued && s.recover === 0 && (s.pose === 'run' || s.pose === 'jump')) {
    s.pose = s.queued
    s.poseFor = 0
    s.queued = null
  }

  // Obstacle collisions (phasing passes through), then anything run past counts as cleared.
  const top = s.height + (s.pose === 'slide' ? RUNNER_BOX.slideHeight : RUNNER_BOX.height)
  for (const o of s.obstacles) {
    if (o.broken || o.passed) continue
    const spec = OBSTACLES[o.kind]
    const overlaps = o.x < RUNNER_RIGHT && o.x + spec.width > RUNNER_LEFT && s.height < spec.lift + spec.height && top > spec.lift
    if (overlaps && s.safeFor === 0 && s.active.phase === 0) crash(s, o)
    else if (o.x + spec.width < RUNNER_LEFT) clear(s, o)
  }
  s.obstacles = s.obstacles.filter((o) => o.x + OBSTACLES[o.kind].width > -200)

  if (s.config.mode === 'speed-run' && s.distance >= FINISH_UNITS) s.status = 'finished'
  return s
}
