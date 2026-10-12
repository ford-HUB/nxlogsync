import { Keyboard } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { COUNTDOWN, MOVE_SECONDS, RUNNER_X, STRIKES } from '@/constants/run-yourself'
import { STRIKE_POINT } from '@/constants/run-yourself-icons'
import { ALL_IMAGES, SPRITES } from '@/constants/run-yourself-sprites'
import { FINISH_UNITS, runBoost } from '@/lib/run-engine'
import { cn } from '@/lib/utils'
import type { RunState } from '@/types/run-yourself'
import { frameAt } from '@/lib/run-stage-layout'
import { EnemyView, Flames, PickupView } from './stage-fight'
import { EffectView, FinishLine, ObstacleView, Scenery, StageSpeedLines } from './stage-props'
import { StageBox, StageSprite } from './stage-sprite'

/** Units run per frame of the run cycle, so the stride quickens with the speed. */
const STRIDE_UNITS = 26
const IDLE_FRAME_MS = 110

/** The runner's frame for its pose: the stride by distance, the moves by how far into them it is. */
function runnerFrame(run: RunState, idleFrame: number) {
  const { pose, poseFor } = run
  switch (pose) {
    case 'idle':
      return SPRITES.idle[idleFrame % SPRITES.idle.length]
    case 'run':
      return SPRITES.run[Math.floor(run.distance / STRIDE_UNITS) % SPRITES.run.length]
    case 'jump': {
      // Rising, at the top, then falling.
      const phase = run.rise > 250 ? 0 : run.rise > 0 ? 1 : run.rise > -250 ? 2 : 3
      return SPRITES.jump[phase]
    }
    case 'slide':
      return frameAt(SPRITES.slide, (poseFor / MOVE_SECONDS.slide) * SPRITES.slide.length)
    case 'punch':
    case 'kick': {
      // Wind-up, the hit held through exactly the strike's active window, then the recovery.
      const { from, to } = STRIKES[pose]
      const frames = SPRITES[pose]
      if (poseFor < from) return frames[poseFor < from / 2 ? 0 : 1]
      if (poseFor <= to) return frames[2]
      return frameAt(frames, 2 + ((poseFor - to) / (MOVE_SECONDS[pose] - to)) * 2)
    }
    case 'stumble':
      return frameAt(SPRITES.stumble, (poseFor / MOVE_SECONDS.stumble) * SPRITES.stumble.length)
    case 'dead':
      return frameAt(SPRITES.dead, (poseFor / MOVE_SECONDS.fall) * SPRITES.dead.length)
  }
}

interface RunStageProps {
  run: RunState
  /** The keyboard is listening; otherwise the prompt asks for a click first. */
  focused: boolean
}

/**
 * The side-scrolling stage: skyline and ground scrolling by the distance run, obstacles, enemies
 * and skill pickups coming in from the right, the runner, and the yellow effects — fire fists glow
 * and flame, phasing leaves afterimages, slow motion tints the edges. Before the first key the
 * runner stands idle under a "press any key" prompt.
 */
export function RunStage({ run, focused }: RunStageProps) {
  const [idleFrame, setIdleFrame] = useState(0)
  const idle = run.status === 'idle'
  const counting = run.status === 'countdown'
  // 3, 2, 1 while counting down.
  const count = Math.ceil(run.countdown / COUNTDOWN.stepSeconds)

  // Every frame decoded up front, so the first jump or slash doesn't flash.
  useEffect(() => {
    for (const src of ALL_IMAGES) new Image().src = src
  }, [])

  useEffect(() => {
    if (!idle && !counting) return
    const timer = window.setInterval(() => setIdleFrame((f) => f + 1), IDLE_FRAME_MS)
    return () => window.clearInterval(timer)
  }, [idle, counting])

  const boost = run.status === 'running' ? runBoost(run.speed) : undefined
  // Blinks while safe after a stumble.
  const blinking = run.safeFor > 0 && Math.floor(run.safeFor * 10) % 2 === 0
  const frame = runnerFrame(run, idleFrame)
  const fire = run.active.fire > 0
  const phasing = run.active.phase > 0
  const striking = (run.pose === 'punch' || run.pose === 'kick') && run.poseFor >= STRIKES[run.pose].from && run.poseFor <= STRIKES[run.pose].to

  return (
    // No frame: the scene fades out at its left and right edges into the page.
    <div className="relative aspect-[10/3] w-full overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <Scenery distance={run.distance} />
      <AnimatePresence>{boost && <StageSpeedLines key={boost} intensity={boost} />}</AnimatePresence>
      {run.config.mode === 'speed-run' && <FinishLine x={RUNNER_X + FINISH_UNITS - run.distance} />}
      {run.obstacles.map((o) => (
        <ObstacleView key={o.id} obstacle={o} />
      ))}
      {run.pickups.map((p) => (
        <PickupView key={p.id} pickup={p} clock={run.elapsed} />
      ))}
      {run.enemies.map((e) => (
        <EnemyView key={e.id} enemy={e} />
      ))}

      {/* Fire fists: a yellow glow around the runner, and a flame at the fist or foot as it lands. */}
      {fire && (
        <StageBox x={RUNNER_X - 45} lift={run.height} width={90} height={90} className="rounded-full bg-score/25 blur-xl" />
      )}
      {/* Phasing: two fading afterimages trail the runner. */}
      {phasing &&
        [2, 1].map((k) => (
          <StageSprite key={k} src={frame} footX={RUNNER_X - k * 16} lift={run.height} style={{ opacity: 0.12 * (3 - k) }} />
        ))}
      <StageSprite
        src={frame}
        footX={RUNNER_X}
        lift={run.height}
        className={cn(blinking && 'opacity-40', phasing && 'opacity-50')}
      />
      {fire && striking && (run.pose === 'punch' || run.pose === 'kick') && (
        <Flames x={STRIKE_POINT[run.pose].x} lift={run.height + STRIKE_POINT[run.pose].lift - 14} size={36} age={run.poseFor} />
      )}
      {run.effects.map((e) => (
        <EffectView key={e.id} effect={e} />
      ))}

      {/* Slow motion: the edges tint yellow while it lasts. */}
      {run.active.slow > 0 && (
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_-10px_var(--score)]" />
      )}

      <AnimatePresence>
        {idle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="flex items-center gap-2 rounded-full border bg-background/85 px-4 py-1.5 font-mono text-[13px] text-foreground shadow-sm"
            >
              <Keyboard className="size-4 text-score" />
              {focused ? 'Press any key to start' : 'Click here, then press any key to start'}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The countdown: each number pops in big and shrinks away, the stage dimmed behind it. */}
      <AnimatePresence>
        {counting && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/30"
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={count}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                className={cn(
                  'font-mono text-[clamp(2.5rem,9vw,6rem)] leading-none font-semibold tabular-nums',
                  count === 1 ? 'text-score' : 'text-foreground',
                )}
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
