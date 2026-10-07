import { useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { Label } from '@/components/ui/label'
import { TimeWheel } from '@/components/time-picker/time-wheel'
import {
  DURATION_HOUR_OPTIONS,
  DURATION_INPUT_MAX_HOURS,
  MINUTE_OPTIONS,
  WHEEL_ITEM_HEIGHT,
} from '@/constants/daily-log'

interface DurationInputProps {
  /** Worked minutes of the current Started → Finished span. */
  value: number
  onChange: (minutes: number) => void
  invalid?: boolean
  /** The day's hours are exactly met; outlined in green like the time pickers. */
  complete?: boolean
  disabled?: boolean
}

/** Digits with at most one dot: hours, then up to two digits of minutes. */
const DRAFT_PATTERN = /^\d{0,2}(\.\d{0,2})?$/

const NO_DISABLED: ReadonlySet<number> = new Set()
const ZERO: ReadonlySet<number> = new Set([0])

/** 83 → "1.23" */
function formatHours(minutes: number): string {
  return `${Math.floor(minutes / 60)}.${String(minutes % 60).padStart(2, '0')}`
}

/** Text that can still become a time as more is typed: "1", "1.", "1.2", "1.23". */
function isDraft(text: string): boolean {
  if (!DRAFT_PATTERN.test(text)) return false
  const [hoursText, minutesText = ''] = text.split('.')
  // A first minute digit above 5 could only lead to 60+ minutes.
  return Number(hoursText || 0) <= DURATION_INPUT_MAX_HOURS && Number(minutesText.padEnd(2, '0')) <= 59
}

/**
 * "1.23" → 83, "2" → 120; null until it is a whole time. Minutes always take two
 * digits, so "1.5" and "1." are still being typed, not 1h 5m.
 */
function parseHours(text: string): number | null {
  if (!isDraft(text) || text.endsWith('.')) return null
  const [hoursText, minutesText] = text.split('.')
  if (minutesText !== undefined && minutesText.length !== 2) return null
  return Number(hoursText || 0) * 60 + Number(minutesText ?? 0)
}

/**
 * Hours worked as h.mm — "1.23" is 1h 23m — in the same wheel box as the time
 * pickers. Scroll the hour or minute wheel, or click the highlighted value (or
 * start typing on a focused wheel) to type it. Either way the finish moves to match.
 */
export function DurationInput({ value, onChange, invalid, complete, disabled }: DurationInputProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  /** The duration when typing began, restored by Escape. */
  const editStart = useRef(value)

  // Both wheels can settle in the same tick; read the latest value, not the render closure.
  const latest = useRef(value)
  latest.current = value
  const hours = Math.floor(value / 60)
  const minutes = value % 60

  const setPart = (patch: { hours?: number; minutes?: number }) => {
    const next = (patch.hours ?? Math.floor(latest.current / 60)) * 60 + (patch.minutes ?? latest.current % 60)
    // A zero duration would collapse the task; the wheels never settle there.
    if (next === 0) return
    latest.current = next
    onChange(next)
  }

  const startEditing = (initial?: string) => {
    if (disabled) return
    editStart.current = value
    setText(initial ?? formatHours(value))
    setEditing(true)
    // Select the whole value when opened by click so typing replaces it.
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      if (initial === undefined) inputRef.current?.select()
    })
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    if (!isDraft(next)) return
    setText(next)
    // An unfinished or zero entry waits for more typing instead of collapsing the task.
    const parsed = parseHours(next)
    if (parsed) onChange(parsed)
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      setEditing(false)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onChange(editStart.current)
      setEditing(false)
    }
  }

  // Typing a digit or dot on a focused wheel switches to the text field.
  const handleBoxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (editing || event.ctrlKey || event.metaKey || event.altKey) return
    if (/^[\d.]$/.test(event.key)) {
      event.preventDefault()
      startEditing(isDraft(event.key) ? event.key : '')
    } else if (event.key === 'Enter') {
      event.preventDefault()
      startEditing()
    }
  }

  // Clicking the highlighted row of either wheel opens the text field.
  const handleBoxClick = (event: MouseEvent<HTMLDivElement>) => {
    if (editing) return
    const target = event.target as HTMLElement
    if (target.closest('[role="option"][aria-selected="true"]')) startEditing()
  }

  const typedInvalid = editing && text !== '' && !parseHours(text)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <Label
          htmlFor="entry-hours"
          onClick={() => startEditing()}
          className="text-[11px] tracking-wider text-muted-foreground uppercase"
        >
          Hours
        </Label>
        <span className="text-[10px] text-muted-foreground/70">h.mm</span>
      </div>
      <div
        data-invalid={invalid || typedInvalid || undefined}
        data-complete={complete || undefined}
        data-disabled={disabled || undefined}
        onKeyDown={handleBoxKeyDown}
        onClick={handleBoxClick}
        title={disabled ? undefined : 'Scroll, or click the value to type it'}
        className="relative grid w-fit grid-cols-[2rem_0.5rem_2rem] items-center rounded-lg border bg-background px-1 transition-colors data-invalid:border-destructive/50 data-complete:border-success/50 data-disabled:pointer-events-none data-disabled:bg-muted/40 data-disabled:opacity-60 [&_[role=option][aria-selected=true]]:cursor-text"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-md bg-muted"
          style={{ height: WHEEL_ITEM_HEIGHT }}
        />
        <TimeWheel
          className="relative"
          label="Hours worked"
          options={DURATION_HOUR_OPTIONS}
          disabledValues={minutes === 0 ? ZERO : NO_DISABLED}
          disabled={disabled}
          value={hours}
          onChange={(h) => setPart({ hours: h })}
        />
        <span aria-hidden className="relative text-center text-sm font-semibold text-muted-foreground">.</span>
        <TimeWheel
          className="relative"
          label="Minutes worked"
          options={MINUTE_OPTIONS}
          disabledValues={hours === 0 ? ZERO : NO_DISABLED}
          disabled={disabled}
          value={minutes}
          onChange={(m) => setPart({ minutes: m })}
        />
        {editing && (
          <input
            ref={inputRef}
            id="entry-hours"
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            // Left unfinished ("1.5"), the wheels keep the last whole duration.
            onBlur={() => setEditing(false)}
            aria-label="Hours worked, h.mm"
            aria-invalid={invalid || typedInvalid || undefined}
            placeholder="0.00"
            className="absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-md bg-muted text-center text-sm font-semibold tabular-nums outline-none ring-2 ring-ring/50 aria-invalid:ring-destructive/40"
            style={{ height: WHEEL_ITEM_HEIGHT }}
          />
        )}
      </div>
    </div>
  )
}
