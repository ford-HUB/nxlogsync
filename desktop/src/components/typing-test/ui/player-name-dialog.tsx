import { Check, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useNameAvailability } from '@/hooks/use-typing-leaderboard'

const MAX_NAME_LENGTH = 20

interface PlayerNameDialogProps {
  open: boolean
  initialName?: string
  /** Resolves to the failure message, if any. */
  onSave: (name: string) => Promise<string | null>
  onCancel: () => void
  /** The save button's label, worded for the game that asked. */
  submitLabel?: string
}

/**
 * Asks for the name the leaderboards show, before the first typing test or Tetris game. It is one
 * name for both: whichever game asks first, the other already knows it.
 */
export function PlayerNameDialog({
  open,
  initialName = '',
  onSave,
  onCancel,
  submitLabel = "Let's type",
}: PlayerNameDialogProps) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = name.trim()
  // Checked against every other player as they type; the save checks again.
  const availability = useNameAvailability(name)
  const taken = availability === 'taken'
  const canSave = !!trimmed && !saving && !taken && availability !== 'checking'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="font-mono">
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSave) return
            setSaving(true)
            const failure = await onSave(trimmed)
            // On success the dialog unmounts; only a failure needs the state back.
            if (failure) {
              setError(failure)
              setSaving(false)
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>What should we call you?</DialogTitle>
            <DialogDescription>
              This name shows next to your scores on the leaderboards, in the typing test and Tetris.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="your name"
            aria-label="Your name"
            aria-invalid={error || taken ? true : undefined}
            aria-describedby="player-name-status"
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
          <p id="player-name-status" aria-live="polite" className="-mt-2 flex min-h-4 items-center gap-1.5 text-[12px]">
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : availability === 'checking' ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Checking…
              </span>
            ) : availability === 'available' ? (
              <span className="flex items-center gap-1.5 text-foreground">
                <Check className="size-3" /> Available
              </span>
            ) : taken ? (
              <span className="flex items-center gap-1.5 text-destructive">
                <X className="size-3" /> That name is taken. Try another one.
              </span>
            ) : availability === 'error' ? (
              <span className="text-muted-foreground">
                Couldn&apos;t check the name; it&apos;s checked again when you save.
              </span>
            ) : null}
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {saving ? 'Saving…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
