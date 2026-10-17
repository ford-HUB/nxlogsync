import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AIM_LAB_SENSITIVITY } from '@/constants/aim-lab'

interface AimLabSensitivityProps {
  value: number
  onChange: (value: number) => void
}

const format = (value: number) => value.toFixed(3)

/**
 * Sensitivity as Valorant shows it: a slider plus a box to type the exact value (three decimals),
 * on Valorant's scale so a player's in-game value can be copied straight across.
 */
export function AimLabSensitivity({ value, onChange }: AimLabSensitivityProps) {
  // The typed text, committed on Enter or blur so a half-typed "0." isn't clamped away
  const [draft, setDraft] = useState(format(value))
  useEffect(() => setDraft(format(value)), [value])

  const commit = () => {
    const typed = Number(draft)
    if (Number.isFinite(typed) && typed > 0) onChange(typed)
    else setDraft(format(value))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
        <label htmlFor="aim-lab-sensitivity">Sensitivity</label>
        <span className="flex items-center gap-1.5">
          {value !== AIM_LAB_SENSITIVITY.default && (
            <button
              type="button"
              aria-label="Reset sensitivity to 1"
              title="Reset to 1.000"
              onClick={() => onChange(AIM_LAB_SENSITIVITY.default)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-3" />
            </button>
          )}
          <input
            id="aim-lab-sensitivity"
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            className="w-16 rounded-md border bg-background px-1.5 py-0.5 text-right text-[12px] tracking-normal text-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </span>
      </div>
      <input
        type="range"
        aria-label="Sensitivity slider"
        min={AIM_LAB_SENSITIVITY.min}
        max={AIM_LAB_SENSITIVITY.max}
        step={AIM_LAB_SENSITIVITY.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-foreground"
      />
      <p className="font-mono text-[10px] text-muted-foreground">Same scale as Valorant · default 1.000</p>
    </div>
  )
}
