import { useRef } from 'react'
import { Label } from '@/components/ui/label'
import {
  HOUR_OPTIONS,
  MINUTES_PER_DAY,
  MINUTE_OPTIONS,
  PERIOD_OPTIONS,
  TIME_STEP_MINUTES,
  WHEEL_ITEM_HEIGHT,
} from '@/constants/daily-log'
import { TimeWheel } from './time-wheel'

interface TimePickerProps {
  label: string
  value: number
  onChange: (minutes: number) => void
  /** Times already covered by a logged entry; shown struck out and never selectable. */
  isTaken?: (minutes: number) => boolean
  invalid?: boolean
  /** The day's hours are exactly met; outlined in green. */
  complete?: boolean
  disabled?: boolean
}

const NEVER_TAKEN = () => false

interface TimeParts {
  hour12: number
  minute: number
  period: number
}

function toParts(minutes: number): TimeParts {
  const hours24 = Math.floor(minutes / 60)
  return { hour12: hours24 % 12 || 12, minute: minutes % 60, period: hours24 >= 12 ? 1 : 0 }
}

function fromParts({ hour12, minute, period }: TimeParts): number {
  return ((hour12 % 12) + period * 12) * 60 + minute
}

function disabledSet(values: number[], isDisabled: (value: number) => boolean): ReadonlySet<number> {
  return new Set(values.filter(isDisabled))
}

/** Closest free time: same hour first (so only the minute wheel moves), then anywhere that day. */
function nearestFree(target: number, isTaken: (minutes: number) => boolean): number {
  if (!isTaken(target)) return target
  const hourStart = target - (target % 60)
  const sameHour = MINUTE_OPTIONS.map((o) => hourStart + o.value)
    .filter((t) => !isTaken(t))
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
  if (sameHour.length > 0) return sameHour[0]
  for (let d = TIME_STEP_MINUTES; d < MINUTES_PER_DAY; d += TIME_STEP_MINUTES) {
    if (target + d < MINUTES_PER_DAY && !isTaken(target + d)) return target + d
    if (target - d >= 0 && !isTaken(target - d)) return target - d
  }
  return target
}

export function TimePicker({ label, value, onChange, isTaken = NEVER_TAKEN, invalid, complete, disabled }: TimePickerProps) {
  // Wheels can settle in the same tick; read the latest value, not the render closure.
  const latest = useRef(value)
  latest.current = value
  const parts = toParts(value)

  const update = (patch: Partial<TimeParts>) => {
    const next = nearestFree(fromParts({ ...toParts(latest.current), ...patch }), isTaken)
    latest.current = next
    onChange(next)
  }

  // Each wheel is one part of the time, so what's blocked depends on the other two wheels.
  const allMinutesTaken = (hour12: number, period: number) =>
    MINUTE_OPTIONS.every((m) => isTaken(fromParts({ hour12, minute: m.value, period })))
  const disabledMinutes = disabledSet(
    MINUTE_OPTIONS.map((o) => o.value),
    (minute) => isTaken(fromParts({ ...parts, minute })),
  )
  const disabledHours = disabledSet(
    HOUR_OPTIONS.map((o) => o.value),
    (hour12) => allMinutesTaken(hour12, parts.period),
  )
  const disabledPeriods = disabledSet(
    PERIOD_OPTIONS.map((o) => o.value),
    (period) => HOUR_OPTIONS.every((h) => allMinutesTaken(h.value, period)),
  )

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] tracking-wider text-muted-foreground uppercase">{label}</Label>
      <div
        data-invalid={invalid || undefined}
        data-complete={complete || undefined}
        data-disabled={disabled || undefined}
        className="relative grid w-fit grid-cols-[2rem_0.5rem_2rem_2.25rem] items-center rounded-lg border bg-background px-1 transition-colors data-invalid:border-destructive/50 data-complete:border-success/50 data-disabled:pointer-events-none data-disabled:bg-muted/40 data-disabled:opacity-60"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-md bg-muted"
          style={{ height: WHEEL_ITEM_HEIGHT }}
        />
        <TimeWheel className="relative" label={`${label} hour`} options={HOUR_OPTIONS} disabledValues={disabledHours} disabled={disabled} value={parts.hour12} onChange={(hour12) => update({ hour12 })} />
        <span aria-hidden className="relative text-center text-sm font-semibold text-muted-foreground">:</span>
        <TimeWheel className="relative" label={`${label} minute`} options={MINUTE_OPTIONS} disabledValues={disabledMinutes} disabled={disabled} value={parts.minute} onChange={(minute) => update({ minute })} />
        <TimeWheel className="relative" label={`${label} AM or PM`} options={PERIOD_OPTIONS} disabledValues={disabledPeriods} disabled={disabled} value={parts.period} onChange={(period) => update({ period })} />
      </div>
    </div>
  )
}
