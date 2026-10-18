import { AIM_LAB_FPS_GOOD, AIM_LAB_FPS_LOW } from '@/constants/aim-lab'
import type { FrameRate } from '@/hooks/use-frame-rate'
import { cn } from '@/lib/utils'

interface AimLabFpsProps {
  rate: FrameRate | null
}

/** The frame rate and frame time in the top-left corner: green when smooth, amber when middling, red when low. */
export function AimLabFps({ rate }: AimLabFpsProps) {
  if (!rate) return null
  const fps = Math.round(rate.fps)

  return (
    <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded-md bg-black/55 px-2.5 py-1.5 font-mono text-[11px] text-white/70 tabular-nums">
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          fps >= AIM_LAB_FPS_GOOD ? 'bg-emerald-400' : fps >= AIM_LAB_FPS_LOW ? 'bg-score' : 'bg-red-500',
        )}
      />
      <span className="text-white">{fps}</span> FPS
      <span className="text-white/40">·</span>
      {rate.frameMs.toFixed(1)} ms
    </div>
  )
}
