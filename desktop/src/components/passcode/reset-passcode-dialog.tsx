import { useState } from 'react'
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { PASSCODE_LENGTH, PASSCODE_MESSAGE } from '@/constants/passcode'
import { PasscodeInput } from './ui/passcode-input'

const DIGITS_ONLY = /\D/g

interface ResetPasscodeDialogProps {
  /** Resolves to false when the current passcode is wrong; on success the app switches to choosing a new one. */
  onReset: (current: string) => Promise<boolean>
  disabled?: boolean
}

export function ResetPasscodeDialog({ onReset, disabled = false }: ResetPasscodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    if (checking) return
    if (next) {
      setValue('')
      setError(null)
    }
    setOpen(next)
  }

  const handleChange = async (raw: string) => {
    if (checking) return
    const digits = raw.replace(DIGITS_ONLY, '').slice(0, PASSCODE_LENGTH)
    setValue(digits)
    if (digits.length > 0) setError(null)
    if (digits.length < PASSCODE_LENGTH) return
    setChecking(true)
    const ok = await onReset(digits)
    // On success the app unmounts this screen for passcode creation, so only the failure path updates state.
    if (ok) return
    setChecking(false)
    setValue('')
    setError(PASSCODE_MESSAGE.resetWrong)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <KeyRound />
          Reset passcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset passcode</DialogTitle>
          <DialogDescription>
            Enter your current passcode, then choose a new one. Your current passcode keeps working until the new one is confirmed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <PasscodeInput
            label="Current passcode"
            value={value}
            onChange={(v) => void handleChange(v)}
            disabled={checking}
            invalid={error !== null}
          />
          <div className="flex min-h-5 items-center">
            {checking ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Checking" />
            ) : (
              error && (
                <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {error}
                </p>
              )
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={checking}>
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
