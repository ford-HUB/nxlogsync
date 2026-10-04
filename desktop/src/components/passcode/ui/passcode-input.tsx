import { useEffect, useRef } from 'react'
import { PASSCODE_LENGTH } from '@/constants/passcode'
import { cn } from '@/lib/utils'

interface PasscodeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  label: string
}

/** One real (masked) input under a row of boxes, so typing, paste and backspace all behave natively. */
export function PasscodeInput({ value, onChange, disabled, invalid, label }: PasscodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep focus in the field whenever it becomes usable again (after a step change or cooldown).
  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled, label])

  return (
    <div className="group relative" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        aria-invalid={invalid || undefined}
        maxLength={PASSCODE_LENGTH}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="absolute inset-0 h-full w-full cursor-default opacity-0"
        autoFocus
      />
      <div className="flex justify-center gap-2" aria-hidden>
        {Array.from({ length: PASSCODE_LENGTH }, (_, i) => {
          const filled = i < value.length
          const active = i === Math.min(value.length, PASSCODE_LENGTH - 1)
          return (
            <span
              key={i}
              className={cn(
                'flex size-11 items-center justify-center rounded-lg border bg-background transition-colors',
                active && 'group-focus-within:border-ring group-focus-within:ring-3 group-focus-within:ring-ring/50',
                invalid && 'border-destructive',
                disabled && 'opacity-50',
              )}
            >
              {filled && <span className="size-2.5 rounded-full bg-foreground" />}
            </span>
          )
        })}
      </div>
    </div>
  )
}
