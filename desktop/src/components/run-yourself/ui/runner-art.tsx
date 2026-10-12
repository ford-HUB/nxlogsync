import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import idle01 from '@/assets/run-yourself/idle-01.png'
import idle02 from '@/assets/run-yourself/idle-02.png'
import idle03 from '@/assets/run-yourself/idle-03.png'
import idle04 from '@/assets/run-yourself/idle-04.png'
import idle05 from '@/assets/run-yourself/idle-05.png'
import idle06 from '@/assets/run-yourself/idle-06.png'
import idle07 from '@/assets/run-yourself/idle-07.png'
import idle08 from '@/assets/run-yourself/idle-08.png'
import run01 from '@/assets/run-yourself/run-01.png'
import run02 from '@/assets/run-yourself/run-02.png'
import run03 from '@/assets/run-yourself/run-03.png'
import run04 from '@/assets/run-yourself/run-04.png'
import run05 from '@/assets/run-yourself/run-05.png'
import run06 from '@/assets/run-yourself/run-06.png'
import run07 from '@/assets/run-yourself/run-07.png'
import run08 from '@/assets/run-yourself/run-08.png'

interface RunnerArtProps {
  /** Hovered: the stickman runs on the spot; otherwise it stands, shifting on its feet. */
  running: boolean
}

const IDLE = { frames: [idle01, idle02, idle03, idle04, idle05, idle06, idle07, idle08], ms: 110 }
const RUN = { frames: [run01, run02, run03, run04, run05, run06, run07, run08], ms: 80 }
const ALL_FRAMES = [...IDLE.frames, ...RUN.frames]

/**
 * The frames are trimmed to a shared 276 × 256 box; one fixed 184-unit square crop (from 49,40)
 * fits the idle and every run frame, so the feet stay put.
 */
const FRAME_WIDTH = 276
const CROP = { size: 184, x: 49, y: 40 }
const cropStyle = {
  width: `${(FRAME_WIDTH / CROP.size) * 100}%`,
  left: `${(-CROP.x / CROP.size) * 100}%`,
  top: `${(-CROP.y / CROP.size) * 100}%`,
}

/**
 * The stickman in a light, square tile, looping its idle stance; hovered, it plays the run cycle.
 * Every frame stays mounted (only the current one shown) so a switch never flashes while one loads.
 */
export function RunnerArt({ running }: RunnerArtProps) {
  const cycle = running ? RUN : IDLE
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setFrame((f) => (f + 1) % cycle.frames.length), cycle.ms)
    return () => {
      window.clearInterval(timer)
      setFrame(0)
    }
  }, [cycle])

  const current = cycle.frames[frame]

  return (
    <div className="relative size-full overflow-hidden rounded-[0.6rem] bg-[#fafafa] ring-1 ring-black/10">
      {ALL_FRAMES.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          style={cropStyle}
          className={cn('absolute max-w-none', src === current ? 'opacity-100' : 'opacity-0')}
        />
      ))}
    </div>
  )
}
