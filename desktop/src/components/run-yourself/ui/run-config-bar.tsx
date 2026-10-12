import { HeartCrack, Timer } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { RunConfig } from '@/types/run-yourself'

interface RunConfigBarProps {
  config: RunConfig
  onChange: (patch: Partial<RunConfig>) => void
  /** Hidden while a run is on, like the typing test. */
  hidden: boolean
}

function Option({ active, onClick, title, children }: { active: boolean; onClick: () => void; title?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
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

/** The two games. */
export function RunConfigBar({ config, onChange, hidden }: RunConfigBarProps) {
  const speedRun = config.mode === 'speed-run'
  return (
    <div
      className={cn(
        'mx-auto flex w-fit flex-wrap items-center justify-center rounded-lg bg-muted/60 px-2 py-1 font-mono transition-opacity duration-200',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <Option active={speedRun} onClick={() => onChange({ mode: 'speed-run' })} title="Race to the finish line, fighting the enemies that run at you">
        <Timer className="size-3.5" /> speed run
      </Option>
      <Option
        active={!speedRun}
        onClick={() => onChange({ mode: 'pass-or-fall' })}
        title="Room after room with one door out, and blocks that move once you trust them"
      >
        <HeartCrack className="size-3.5" /> pass or fall
      </Option>
    </div>
  )
}
