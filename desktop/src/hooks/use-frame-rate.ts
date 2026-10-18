import { useEffect, useRef, useState } from 'react'
import { AIM_LAB_FPS_HITCH_MS, AIM_LAB_FPS_SAMPLE_MS } from '@/constants/aim-lab'

export interface FrameRate {
  fps: number
  /** The slowest frame of the last sample, in milliseconds, so a single stutter shows. */
  worstMs: number
  /** The highest sampled frame rate while playing this round; null until the round runs. */
  peak: number | null
}

/**
 * The window's frame rate while `enabled`, sampled every AIM_LAB_FPS_SAMPLE_MS, or straight after a
 * frame slower than AIM_LAB_FPS_HITCH_MS. The Unity build draws on the same animation frames, so this
 * is the game's frame rate too; null until the first sample. The peak counts only while `playing`
 * and starts over each time `round` turns true.
 */
export function useFrameRate(enabled: boolean, round: boolean, playing: boolean): FrameRate | null {
  const [rate, setRate] = useState<FrameRate | null>(null)
  const peakRef = useRef<number | null>(null)
  const playingRef = useRef(playing)
  playingRef.current = playing

  useEffect(() => {
    if (round) peakRef.current = null
  }, [round])

  useEffect(() => {
    if (!enabled) return
    let frames = 0
    let worst = 0
    let since = performance.now()
    let last = since
    let id = requestAnimationFrame(function tick(now) {
      frames++
      worst = Math.max(worst, now - last)
      last = now
      const elapsed = now - since
      if (elapsed >= AIM_LAB_FPS_SAMPLE_MS || worst >= AIM_LAB_FPS_HITCH_MS) {
        const fps = (frames * 1000) / elapsed
        if (playingRef.current) peakRef.current = Math.max(peakRef.current ?? 0, fps)
        setRate({ fps, worstMs: worst, peak: peakRef.current })
        frames = 0
        worst = 0
        since = now
      }
      id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(id)
  }, [enabled])

  return rate
}
