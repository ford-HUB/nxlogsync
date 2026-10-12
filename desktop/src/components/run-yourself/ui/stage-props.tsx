import { motion } from 'motion/react'
import { EFFECT_SECONDS, GROUND_Y, OBSTACLES, STAGE } from '@/constants/run-yourself'
import { PROPS, SPRITES } from '@/constants/run-yourself-sprites'
import { cn } from '@/lib/utils'
import type { Obstacle, RunEffect } from '@/types/run-yourself'
import { frameAt } from '@/lib/run-stage-layout'
import { Flames } from './stage-fight'
import { StageBox } from './stage-sprite'

/** Art drawn a little past the hitbox, so contact looks like contact. */
const ROCKS_ART = { width: 112, height: 48 }
const GROUND_TILE = 210
const TILE_OVERLAP = 4
const SKYLINE_TILE = { width: 290, height: 200 }
/** The skyline drifts at this share of the ground's speed. */
const SKYLINE_PARALLAX = 0.25

/** Rocks on the ground, or a block hung low enough that only a slide gets under it. */
export function ObstacleView({ obstacle: o }: { obstacle: Obstacle }) {
  const spec = OBSTACLES[o.kind]
  const fade = o.broken ? Math.max(0, 1 - o.brokenFor / 0.5) : 1

  switch (o.kind) {
    case 'rocks':
      return (
        <StageBox x={o.x - (ROCKS_ART.width - spec.width) / 2} lift={-4} {...ROCKS_ART} style={{ opacity: fade }}>
          <img src={PROPS.rocks} alt="" draggable={false} className="size-full grayscale" />
        </StageBox>
      )
    case 'block':
      // Black in dark mode, white in light, outlined like the stickman art; hung from the top.
      return (
        <>
          {[0.18, 0.82].map((p) => (
            <StageBox
              key={p}
              x={o.x + spec.width * p}
              lift={spec.lift + spec.height}
              width={1.5}
              height={GROUND_Y - spec.lift - spec.height}
              className="bg-foreground/60"
              style={{ opacity: fade }}
            />
          ))}
          <StageBox
            x={o.x}
            lift={spec.lift}
            width={spec.width}
            height={spec.height}
            className="rounded-sm border-2 border-foreground bg-white dark:bg-black"
            style={{ opacity: fade }}
          />
        </>
      )
  }
}

/** A yellow hit burst (the pack's hit effect, tinted), flames, or a yellow "+points" or word floating up. */
export function EffectView({ effect: e }: { effect: RunEffect }) {
  const t = e.age / EFFECT_SECONDS
  if (e.kind === 'fire') return <Flames x={e.x} lift={e.y - 40} size={90} age={e.age} fade={1 - t * 0.5} />
  if (e.kind === 'points') {
    return (
      <StageBox x={e.x - 70} lift={e.y + t * 40} width={140} height={24} style={{ opacity: 1 - t }}>
        <span className="flex size-full items-center justify-center font-mono text-[clamp(10px,1.4vw,16px)] font-semibold text-score tabular-nums">
          {e.label && e.points ? `${e.label} +${e.points}` : (e.label ?? `+${e.points}`)}
        </span>
      </StageBox>
    )
  }
  const src = frameAt(SPRITES.hitEffect, t * SPRITES.hitEffect.length)
  return (
    <StageBox x={e.x - 31} lift={e.y - 60} width={62} height={120} style={{ opacity: 1 - t * 0.6 }}>
      <span
        className="block size-full bg-score"
        style={{ maskImage: `url(${src})`, maskSize: '100% 100%', WebkitMaskImage: `url(${src})`, WebkitMaskSize: '100% 100%' }}
      />
    </StageBox>
  )
}

/** Tiles of an image along the stage, shifted left by `offset` (wrapping), so it scrolls. */
function Tiles({ src, tile, lift, height, offset, className }: {
  src: string
  tile: number
  lift: number
  height: number
  offset: number
  className?: string
}) {
  const shift = offset % tile
  const count = Math.ceil(STAGE.width / tile) + 1
  // Each tile overlaps the next a little, so their soft edges never leave a seam; faded as one
  // layer so the overlaps don't show as darker lines either.
  return (
    <div className={cn('pointer-events-none absolute inset-0', className)}>
      {Array.from({ length: count }, (_, i) => (
        <StageBox key={i} x={i * tile - shift} lift={lift} width={tile + TILE_OVERLAP} height={height}>
          <img src={src} alt="" draggable={false} className="size-full grayscale" />
        </StageBox>
      ))}
    </div>
  )
}

/** The skyline behind and the ground underfoot, scrolling with the distance run. */
export function Scenery({ distance }: { distance: number }) {
  return (
    <>
      <Tiles
        src={PROPS.skyline}
        tile={SKYLINE_TILE.width}
        lift={-10}
        height={SKYLINE_TILE.height}
        offset={distance * SKYLINE_PARALLAX}
        className="opacity-25"
      />
      <Tiles src={PROPS.ground} tile={GROUND_TILE} lift={-(STAGE.height - GROUND_Y) - 2} height={STAGE.height - GROUND_Y + 8} offset={distance} />
    </>
  )
}

/** Streaks rushing past behind the runner: more, longer and faster as the speed climbs. */
export function StageSpeedLines({ intensity }: { intensity: number }) {
  const count = Math.round(6 + 16 * intensity)
  const speed = 0.9 - 0.6 * intensity
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: count }, (_, k) => (
        <motion.span
          key={k}
          initial={{ left: '110%' }}
          animate={{ left: '-30%' }}
          transition={{ duration: speed * (0.7 + (k % 5) * 0.12), repeat: Infinity, delay: (k * 0.11) % 0.9, ease: 'linear' }}
          style={{ top: `${6 + ((k * 37) % 70)}%`, width: `${(6 + ((k * 53) % 14)) * (0.6 + intensity)}%` }}
          className={
            k % 3 === 0
              ? 'absolute h-0.5 bg-gradient-to-r from-transparent via-score/70 to-transparent'
              : 'absolute h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent'
          }
        />
      ))}
    </motion.div>
  )
}

/** A black-and-white checkered finish line, scrolling in as a speed run nears its end. */
export function FinishLine({ x }: { x: number }) {
  if (x > STAGE.width + 40 || x < -40) return null
  return (
    <StageBox x={x - 9} lift={0} width={18} height={GROUND_Y - 30}>
      <span className="block size-full border-x-2 border-foreground bg-[repeating-conic-gradient(var(--foreground)_0_25%,var(--background)_0_50%)] bg-[length:10px_10px]" />
      <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-background">
        FINISH
      </span>
    </StageBox>
  )
}
