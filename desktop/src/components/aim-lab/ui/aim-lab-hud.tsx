import { motion } from 'motion/react'
import type { AimLabGameState } from '@/types/aim-lab'

interface AimLabHudProps {
  game: AimLabGameState
}

/** The running round's clock, hits and accuracy, over the top of the range. Clicks pass through. */
export function AimLabHud({ game }: AimLabHudProps) {
  const left = Math.max(0, game.timeLeft)
  const urgent = left <= 10

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"
    >
      <div className="flex min-w-72 flex-col gap-2 rounded-xl bg-black/55 px-5 py-3 font-mono text-white shadow-lg">
        <div className="grid grid-cols-3 items-end gap-6 tabular-nums">
          <Stat label="hits" value={String(game.score)} />
          <span className={`text-center text-[28px] leading-none font-semibold ${urgent ? 'text-score' : ''}`}>{left.toFixed(1)}</span>
          <Stat label="accuracy" value={`${game.shotsFired > 0 ? game.accuracy.toFixed(1) : '—'}%`} align="right" />
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full ${urgent ? 'bg-score' : 'bg-white/80'}`}
            style={{ width: `${(left / game.roundSeconds) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function Stat({ label, value, align = 'left' }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <span className={`flex flex-col gap-0.5 ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span className="text-[10px] tracking-[0.14em] text-white/60 uppercase">{label}</span>
      <span className="text-[18px] leading-none">{value}</span>
    </span>
  )
}
