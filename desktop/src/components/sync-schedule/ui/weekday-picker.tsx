import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { WEEKDAY_ORDER, WEEKDAY_SHORT } from '@/constants/sync-schedule'
import type { Weekday } from '@/types/sync-schedule'

interface WeekdayPickerProps {
  value: Weekday[]
  onToggle: (day: Weekday) => void
  invalid?: boolean
}

export function WeekdayPicker({ value, onToggle, invalid }: WeekdayPickerProps) {
  const selected = value.map(String)

  // Diff against the current value so the hook keeps owning the toggle logic.
  const handleChange = (next: string[]) => {
    const changed = WEEKDAY_ORDER.find((d) => next.includes(String(d)) !== selected.includes(String(d)))
    if (changed !== undefined) onToggle(changed)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] tracking-wider text-muted-foreground uppercase">On these days</Label>
      <ToggleGroup
        type="multiple"
        variant="outline"
        spacing={0}
        value={selected}
        onValueChange={handleChange}
        aria-invalid={invalid || undefined}
        aria-label="Sync days"
      >
        {WEEKDAY_ORDER.map((day) => (
          <ToggleGroupItem
            key={day}
            value={String(day)}
            aria-label={WEEKDAY_SHORT[day]}
            className="w-11 text-[12px] data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {WEEKDAY_SHORT[day]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
