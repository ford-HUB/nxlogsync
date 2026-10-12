import type { CSSProperties } from 'react'
import { GROUND_Y, STAGE } from '@/constants/run-yourself'

/** Frame `index` of an animation, held on its first or last frame outside the range. */
export const frameAt = (frames: string[], index: number) =>
  frames[Math.min(frames.length - 1, Math.max(0, Math.floor(index)))]

/** A box on the stage, in stage units (left edge, height of its bottom above the ground, size). */
export function stageBox(x: number, lift: number, width: number, height: number): CSSProperties {
  return {
    left: `${(x / STAGE.width) * 100}%`,
    top: `${((GROUND_Y - lift - height) / STAGE.height) * 100}%`,
    width: `${(width / STAGE.width) * 100}%`,
    height: `${(height / STAGE.height) * 100}%`,
  }
}
