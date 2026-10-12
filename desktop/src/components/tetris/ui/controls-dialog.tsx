import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DEFAULT_TETRIS_KEYS, MAX_KEYS_PER_ACTION, RESERVED_KEYS, TETRIS_ACTIONS, TETRIS_KEY_PRESETS } from '@/constants/tetris'
import { bindKey, keyLabel, normalizeKey, sameBindings } from '@/lib/tetris-keys'
import { cn } from '@/lib/utils'
import type { TetrisKeysSync } from '@/store/tetris-store'
import type { TetrisAction, TetrisKeyBindings } from '@/types/tetris'

interface ControlsDialogProps {
  open: boolean
  keys: TetrisKeyBindings
  sync: TetrisKeysSync
  onChange: (keys: TetrisKeyBindings) => void
  onClose: () => void
}

interface Slot {
  action: TetrisAction
  index: number
}

/** Where the controls are being kept, under the list. */
const SYNC_LABELS: Record<TetrisKeysSync, string> = {
  local: 'Saved on this computer. Sign in to keep them on your account.',
  loading: 'Loading your controls…',
  saving: 'Saving to your account…',
  saved: 'Saved to your account.',
  error: "Couldn't reach the server; saved on this computer for now.",
}

const SLOTS = Array.from({ length: MAX_KEYS_PER_ACTION }, (_, i) => i)

/**
 * The player's key preferences: a preset to start from, then any action rebound by clicking its
 * slot and pressing a key. Backspace clears a slot; Escape cancels the capture.
 */
export function ControlsDialog({ open, keys, sync, onChange, onClose }: ControlsDialogProps) {
  const [capturing, setCapturing] = useState<Slot | null>(null)

  useEffect(() => {
    if (!open) setCapturing(null)
  }, [open])

  // While a slot listens, the next key is the binding; it reaches nothing else (not even the dialog's Escape).
  useEffect(() => {
    if (!capturing) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.repeat) return
      if (e.key === 'Escape') setCapturing(null)
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        onChange(bindKey(keys, capturing.action, capturing.index, null))
        setCapturing(null)
      } else if (!RESERVED_KEYS.has(e.key)) {
        onChange(bindKey(keys, capturing.action, capturing.index, normalizeKey(e.key)))
        setCapturing(null)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [capturing, keys, onChange])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="font-mono">
        <DialogHeader>
          <DialogTitle>Controls</DialogTitle>
          <DialogDescription>Pick a layout, or click a key and press a new one. Backspace clears it.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">preset</span>
          {Object.values(TETRIS_KEY_PRESETS).map((preset) => (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={sameBindings(keys, preset.keys) ? 'secondary' : 'ghost'}
              onClick={() => onChange(preset.keys)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            disabled={sameBindings(keys, DEFAULT_TETRIS_KEYS)}
            onClick={() => onChange(DEFAULT_TETRIS_KEYS)}
          >
            <RotateCcw /> reset
          </Button>
        </div>

        <ul className="flex flex-col gap-1">
          {TETRIS_ACTIONS.map(({ action, label }) => {
            const bound = keys[action] ?? []
            return (
              <li key={action} className="flex items-center gap-3 rounded-md px-2 py-1 even:bg-muted/40">
                <span className={cn('flex-1 text-[12px]', bound.length === 0 ? 'text-destructive' : 'text-foreground')}>
                  {label}
                  {bound.length === 0 && <span className="ml-2 text-[10px]">unbound</span>}
                </span>
                {SLOTS.map((index) => {
                  const listening = capturing?.action === action && capturing.index === index
                  // A second slot only after the first is filled.
                  const usable = index <= bound.length
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!usable}
                      onClick={() => setCapturing(listening ? null : { action, index })}
                      className={cn(
                        'min-w-16 rounded-md border px-2 py-0.5 text-[12px] transition-colors',
                        listening
                          ? 'animate-pulse border-primary text-primary'
                          : bound[index]
                            ? 'bg-muted/60 text-foreground hover:border-foreground/40'
                            : 'border-dashed text-muted-foreground hover:text-foreground',
                        !usable && 'invisible',
                      )}
                    >
                      {listening ? 'press…' : bound[index] ? keyLabel(bound[index]) : '+'}
                    </button>
                  )
                })}
              </li>
            )
          })}
        </ul>
        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
          <p>Esc always closes the game. A key used elsewhere moves to its new action.</p>
          <p className={cn(sync === 'error' && 'text-destructive')}>{SYNC_LABELS[sync]}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
