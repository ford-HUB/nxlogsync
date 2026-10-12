import { ENEMY, PICKUP_SIZE } from '@/constants/run-yourself'
import { SKILL_ICONS } from '@/constants/run-yourself-icons'
import { SPRITES } from '@/constants/run-yourself-sprites'
import { enemyLift, leapProgress } from '@/lib/run-engine'
import { frameAt } from '@/lib/run-stage-layout'
import { cn } from '@/lib/utils'
import type { RunEnemy, SkillPickup } from '@/types/run-yourself'
import { StageBox, StageSprite } from './stage-sprite'

/** Seconds per frame of an enemy's run, its stagger when hit, and its fall. */
const ENEMY_RUN_FRAME = 0.06
const ENEMY_STAGGER = 0.28
const ENEMY_FALL_FRAME = 0.07

/**
 * A planted enemy's frame. A puncher guards, draws back as it opens, and shows the full punch only
 * once it lands, so the fist touches the runner on the frame it's knocked out. A jump kicker
 * crouches, leaps with its knee up, and shoots the foot out as it closes onto the runner.
 */
function windupFrame(e: RunEnemy) {
  const landed = e.stateFor >= e.windup
  if (e.attack === 'jump-kick') {
    const leap = leapProgress(e)
    if (landed) return SPRITES.kick[2]
    if (leap === 0) return SPRITES.jump[0]
    return SPRITES.kick[leap < 0.8 ? 0 : 1]
  }
  if (landed) return SPRITES.punch[2]
  return SPRITES.punch[e.stateFor < e.windup * (1 - e.opening) ? 0 : 1]
}

/**
 * An enemy stickman facing the runner, drawn in the opposite tone to it (dark where the runner is
 * light), so the two never blur together. Planted, it winds up its punch or jump kick under a
 * yellow "!" that fills as the attack comes; put down, it staggers and falls, in flames if fire fists did it.
 */
export function EnemyView({ enemy: e }: { enemy: RunEnemy }) {
  let src: string
  if (e.state === 'charging') src = SPRITES.run[Math.floor(e.stateFor / ENEMY_RUN_FRAME) % SPRITES.run.length]
  else if (e.state === 'windup') src = windupFrame(e)
  else if (e.stateFor < ENEMY_STAGGER) src = frameAt(SPRITES.stumble, (e.stateFor / ENEMY_STAGGER) * SPRITES.stumble.length)
  else src = frameAt(SPRITES.dead, (e.stateFor - ENEMY_STAGGER) / ENEMY_FALL_FRAME)
  const fade = e.state === 'down' ? Math.max(0, 1 - Math.max(0, e.stateFor - 0.6) / (ENEMY.downSeconds - 0.6)) : 1
  const windup = e.state === 'windup' ? Math.min(1, e.stateFor / e.windup) : 0
  const lift = enemyLift(e)

  return (
    <>
      <StageSprite src={src} footX={e.x} lift={lift} flip className="invert dark:invert-0" style={{ opacity: fade }} />
      {e.state === 'windup' && (
        <StageBox x={e.x - 9} lift={lift + ENEMY.height + 18} width={18} height={26}>
          <span
            className="flex size-full items-center justify-center rounded-full font-mono text-[clamp(10px,1.3vw,15px)] font-black text-score"
            style={{ transform: `scale(${0.7 + windup * 0.6})`, opacity: 0.5 + windup * 0.5 }}
          >
            !
          </span>
        </StageBox>
      )}
      {e.state === 'down' && e.burning && <Flames x={e.x} lift={10} size={70} age={e.stateFor} fade={fade} />}
    </>
  )
}

/** A skill floating on the course: a yellow ring with its icon, bobbing. */
export function PickupView({ pickup: p, clock }: { pickup: SkillPickup; clock: number }) {
  const Icon = SKILL_ICONS[p.kind]
  const bob = Math.sin(clock * 5 + p.id) * 5
  return (
    <StageBox x={p.x - PICKUP_SIZE / 2} lift={p.lift - PICKUP_SIZE / 2 + bob} width={PICKUP_SIZE} height={PICKUP_SIZE}>
      <span className="flex size-full items-center justify-center rounded-full border-2 border-score bg-background/80 text-score shadow-[0_0_12px_var(--score)]">
        <Icon className="size-[55%]" strokeWidth={2.5} />
      </span>
    </StageBox>
  )
}

interface FlamesProps {
  x: number
  lift: number
  size: number
  /** Seconds since they caught, for the flicker. */
  age: number
  fade?: number
  className?: string
}

/** Three yellow tongues of flame licking up from a point, flickering. */
export function Flames({ x, lift, size, age, fade = 1, className }: FlamesProps) {
  return (
    <StageBox x={x - size / 2} lift={lift} width={size} height={size} className={cn('pointer-events-none', className)} style={{ opacity: fade }}>
      {[0, 1, 2].map((k) => {
        const flicker = 0.75 + 0.25 * Math.sin(age * 22 + k * 2.1)
        return (
          <span
            key={k}
            className="absolute bottom-0 rounded-[50%_50%_45%_45%/65%_65%_35%_35%] bg-gradient-to-t from-score to-score/0 blur-[0.5px]"
            style={{
              left: `${18 + k * 22}%`,
              width: '30%',
              height: `${(k === 1 ? 95 : 65) * flicker}%`,
              opacity: 0.85,
            }}
          />
        )
      })}
    </StageBox>
  )
}
