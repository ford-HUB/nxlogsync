import { AIM_LAB_FPS_GOOD, AIM_LAB_FPS_LOW } from '@/constants/aim-lab'
import { useFrameRate } from '@/hooks/use-frame-rate'
import { cn } from '@/lib/utils'

interface AimLabFpsProps {
  /** A round is armed, running or paused; arming one starts the peak over. */
  round: boolean
  /** The round is running, the only time the peak counts. */
  playing: boolean
}

/**
 * The live frame rate, the slowest recent frame and the round's peak in the top-left corner. The dot
 * goes by the slowest frame, so a stutter turns it amber or red at once: green when smooth, amber
 * when middling, red when low. Samples here rather than in the game so only this re-renders.
 */
export function AimLabFps({ round, playing }: AimLabFpsProps) {
  const rate = useFrameRate(true, round, playing)
  if (!rate) return null
  const fps = Math.round(rate.fps)
  const low = Math.min(fps, 1000 / rate.worstMs)

  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded-md bg-black/55 px-2.5 py-1.5 font-mono text-[11px] text-white/70 tabular-nums">
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          low >= AIM_LAB_FPS_GOOD ? 'bg-emerald-400' : low >= AIM_LAB_FPS_LOW ? 'bg-score' : 'bg-red-500',
        )}
      />
      <span className="text-white">{fps}</span> FPS
      <span className="text-white/40">·</span>
      {rate.worstMs.toFixed(1)} ms
      {rate.peak !== null && (
        <>
          <span className="text-white/40">·</span>
          peak <span className="text-white">{Math.round(rate.peak)}</span>
        </>
      )}
    </div>
  )
}
