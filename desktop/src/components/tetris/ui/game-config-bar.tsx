import { Ghost, Gauge } from 'lucide-react'
import type { ReactNode } from 'react'
import { START_LEVELS } from '@/constants/tetris'
import { startMultiplier } from '@/lib/tetris-engine'
import { cn } from '@/lib/utils'
import type { TetrisConfig } from '@/types/tetris'

interface GameConfigBarProps {
  config: TetrisConfig
  onChange: (patch: Partial<TetrisConfig>) => void
  /** Hidden while a game runs, like the typing test's bar. */
  hidden: boolean
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Keep the keyboard on the game, not on the button.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-4 w-px bg-border" />

/** One row of game settings: the ghost piece, then the start level with its score bonus. */
export function GameConfigBar({ config, onChange, hidden }: GameConfigBarProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-fit flex-wrap items-center justify-center rounded-lg bg-muted/60 px-2 py-1 font-mono transition-opacity duration-200',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <Option active={config.ghost} onClick={() => onChange({ ghost: !config.ghost })}>
        <Ghost className="size-3.5" /> ghost
      </Option>
      <Divider />
      <span className="flex items-center gap-1.5 px-2 text-[12px] text-muted-foreground">
        <Gauge className="size-3.5" /> level
      </span>
      {START_LEVELS.map((n) => (
        <Option key={n} active={config.startLevel === n} onClick={() => onChange({ startLevel: n })}>
          <span className="tabular-nums">{n}</span>
          {startMultiplier(n) > 1 && <span className="text-[10px] text-score tabular-nums">×{startMultiplier(n)}</span>}
        </Option>
      ))}
    </div>
  )
}
