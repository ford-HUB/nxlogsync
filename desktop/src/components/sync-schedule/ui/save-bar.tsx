import { Button } from '@/components/ui/button'

interface SaveBarProps {
  canSave: boolean
  onSave: () => void
  onDiscard: () => void
}

export function SaveBar({ canSave, onSave, onDiscard }: SaveBarProps) {
  return (
    <div
      role="region"
      aria-label="Unsaved changes"
      className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-md ring-1 ring-foreground/10 animate-in fade-in slide-in-from-bottom-2"
    >
      <span className="text-[13px]">
        Unsaved changes
        <span className="text-muted-foreground"> · the schedule keeps its current settings until you save</span>
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        <Button type="button" onClick={onSave} disabled={!canSave}>
          Save changes
        </Button>
      </div>
    </div>
  )
}
