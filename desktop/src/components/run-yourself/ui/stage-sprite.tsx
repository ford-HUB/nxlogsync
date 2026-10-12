import type { CSSProperties, ReactNode } from 'react'
import { FRAME, FRAME_FOOT } from '@/constants/run-yourself'
import { stageBox } from '@/lib/run-stage-layout'
import { cn } from '@/lib/utils'

/** Absolutely placed on the stage by stageBox. */
export function StageBox({ x, lift, width, height, className, style, children }: {
  x: number
  lift: number
  width: number
  height: number
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div className={cn('absolute', className)} style={{ ...stageBox(x, lift, width, height), ...style }}>
      {children}
    </div>
  )
}

interface StageSpriteProps {
  src: string
  /** Where the figure's feet are: x along the stage, and height above the ground. */
  footX: number
  lift?: number
  /** Faces left instead of right. */
  flip?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * One 2D Stickman frame, placed by the figure's feet so every animation lines up. Inverted in
 * dark mode, so the black outlines stay visible on the dark stage; grayscale, like the rest of the
 * black-and-white scene.
 */
export function StageSprite({ src, footX, lift = 0, flip = false, className, style }: StageSpriteProps) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        ...stageBox(footX - FRAME.width * FRAME_FOOT.x, lift - FRAME.height * (1 - FRAME_FOOT.y), FRAME.width, FRAME.height),
        transform: flip ? 'scaleX(-1)' : undefined,
        transformOrigin: `${FRAME_FOOT.x * 100}% ${FRAME_FOOT.y * 100}%`,
        ...style,
      }}
      className={cn('pointer-events-none absolute max-w-none select-none grayscale dark:invert', className)}
    />
  )
}
