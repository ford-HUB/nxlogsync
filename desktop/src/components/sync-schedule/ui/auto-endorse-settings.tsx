import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatDayOfMonth } from '@/constants/sync-schedule'
import type { AutoEndorseSetting } from '@/types/sync-schedule'

interface AutoEndorseSettingsProps {
  draft: AutoEndorseSetting
  dirty: boolean
  loading: boolean
  saving: boolean
  error: string | null
  onToggle: (enabled: boolean) => void
  onSave: () => void
}

/**
 * The footer's auto-endorse switch. While it's on, the calendar picks the day
 * of the month it runs on instead of days to endorse now.
 */
export function AutoEndorseSettings({
  draft,
  dirty,
  loading,
  saving,
  error,
  onToggle,
  onSave,
}: AutoEndorseSettingsProps) {
  return (
    <div className="mr-auto flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-2">
        <Switch
          id="auto-endorse"
          size="sm"
          checked={draft.enabled}
          onCheckedChange={onToggle}
          disabled={loading || saving}
        />
        <Label htmlFor="auto-endorse" className="text-[13px]">
          Auto-endorse
        </Label>
      </div>

      {error ? (
        <span className="text-[12px] text-destructive">{error}</span>
      ) : (
        draft.enabled && (
          <span className="text-[12px] text-muted-foreground">
            {draft.dayOfMonth === null
              ? 'Pick a day on the calendar'
              : `11:59 PM on the ${formatDayOfMonth(draft.dayOfMonth)} of each month`}
          </span>
        )
      )}

      {dirty && (
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={saving || (draft.enabled && draft.dayOfMonth === null)}
        >
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      )}
    </div>
  )
}
