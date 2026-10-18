import { useEffect, useState } from 'react'
import { AIM_LAB_FPS_SAMPLE_MS } from '@/constants/aim-lab'

export interface FrameRate {
  fps: number
  /** Average time per frame over the last sample, in milliseconds. */
  frameMs: number
}

/**
 * The window's frame rate while `enabled`, sampled every AIM_LAB_FPS_SAMPLE_MS. The Unity build
 * draws on the same animation frames, so this is the game's frame rate too; null until the first sample.
 */
export function useFrameRate(enabled: boolean): FrameRate | null {
  const [rate, setRate] = useState<FrameRate | null>(null)

  useEffect(() => {
    if (!enabled) return
    let frames = 0
    let since = performance.now()
    let id = requestAnimationFrame(function tick(now) {
      frames++
      const elapsed = now - since
      if (elapsed >= AIM_LAB_FPS_SAMPLE_MS) {
        setRate({ fps: (frames * 1000) / elapsed, frameMs: elapsed / frames })
        frames = 0
        since = now
      }
      id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [enabled])

  return rate
}
