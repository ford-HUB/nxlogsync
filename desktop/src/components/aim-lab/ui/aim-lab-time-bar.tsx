import { Clock } from 'lucide-react'
import { AIM_LAB_SETUPS } from '@/constants/aim-lab'
import { cn } from '@/lib/utils'

interface AimLabTimeBarProps {
  seconds: number
  onChange: (seconds: number) => void
}

/** The round lengths, like the typing test's time bar; each has its own leaderboard. */
export function AimLabTimeBar({ seconds, onChange }: AimLabTimeBarProps) {
  return (
    <div className="flex items-center rounded-lg border bg-background px-2 py-1 font-mono shadow-lg">
      <span className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-foreground">
        <Clock className="size-3.5" /> time
      </span>
      <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      {AIM_LAB_SETUPS.map((option) => (
        <button
          key={option.seconds}
          type="button"
          aria-pressed={seconds === option.seconds}
          onClick={() => onChange(option.seconds)}
          className={cn(
            'rounded-md px-2 py-1 text-[12px] tabular-nums transition-colors',
            seconds === option.seconds ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.seconds}
        </button>
      ))}
    </div>
  )
}
