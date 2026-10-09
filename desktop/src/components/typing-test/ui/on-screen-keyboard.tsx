import { cn } from '@/lib/utils'

interface OnScreenKeyboardProps {
  /** Keys held down right now, lowercased ('space' for the space bar). */
  pressed: ReadonlySet<string>
}

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row) => row.split(''))

function Key({ label, down, className }: { label: string; down: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 items-center [@media(min-height:720px)]:h-12 justify-center rounded-lg border font-mono text-[13px] transition-[transform,background-color,color,box-shadow] duration-75',
        down
          ? 'translate-y-px border-foreground/25 bg-muted font-semibold text-foreground shadow-[0_1px_0_0_var(--border)] ring-1 ring-foreground/15'
          : 'border-border/70 bg-muted/50 text-muted-foreground shadow-[0_3px_0_0_var(--border)]',
        className,
      )}
    >
      {label}
    </span>
  )
}

/** A staggered QWERTY under the words that lights up each key as it is pressed. */
export function OnScreenKeyboard({ pressed }: OnScreenKeyboardProps) {
  return (
    <div aria-hidden className="flex flex-col items-center gap-1.5 select-none sm:gap-2">
      {ROWS.map((row) => (
        <div key={row[0]} className="flex gap-1.5 sm:gap-2">
          {row.map((key) => (
            <Key key={key} label={key} down={pressed.has(key)} className="w-[min(3rem,calc((100vw-5rem)/10))]" />
          ))}
        </div>
      ))}
      <Key label="SPACE" down={pressed.has('space')} className="w-[min(18.75rem,calc((100vw-5rem)*0.625))] text-[11px] tracking-[0.15em]" />
    </div>
  )
}
