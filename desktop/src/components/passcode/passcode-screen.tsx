import { AlertCircle, Clock, Loader2, LockKeyhole } from 'lucide-react'
import logo from '@/assets/logo-nxlogsync.png'
import { Button } from '@/components/ui/button'
import { PASSCODE_LENGTH } from '@/constants/passcode'
import { usePasscodeScreen, type PasscodeStep } from '@/hooks/use-passcode-screen'
import { PasscodeInput } from './ui/passcode-input'

const STEP_COPY: Record<PasscodeStep, { title: string; hint: string }> = {
  create: {
    title: 'Create a passcode',
    hint: `Choose a ${PASSCODE_LENGTH}-digit passcode. You’ll enter it each time NXLogSync opens.`,
  },
  confirm: { title: 'Confirm your passcode', hint: 'Enter the same passcode again.' },
  unlock: { title: 'Enter passcode', hint: 'NXLogSync is locked.' },
}

const REPLACE_COPY = {
  title: 'Choose a new passcode',
  hint: `Enter a new ${PASSCODE_LENGTH}-digit passcode. Your current one keeps working until you confirm.`,
}

export function PasscodeScreen() {
  const screen = usePasscodeScreen()
  const copy = screen.replacing && screen.step === 'create' ? REPLACE_COPY : STEP_COPY[screen.step]
  const message = screen.coolingDown ? `${screen.error} Try again in ${screen.cooldownSeconds}s.` : screen.error

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border bg-card px-6 py-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="NXLogSync" className="size-12 rounded-lg" />
          <div className="flex flex-col gap-1">
            <h1 className="flex items-center justify-center gap-1.5 text-lg font-semibold tracking-tight">
              {screen.step === 'unlock' && <LockKeyhole className="size-4 text-muted-foreground" />}
              {copy.title}
            </h1>
            <p className="text-[13px] text-muted-foreground">{copy.hint}</p>
          </div>
        </div>

        {screen.lockReason && (
          <p className="flex items-start gap-1.5 rounded-lg bg-muted px-3 py-2 text-[12px] text-muted-foreground">
            <Clock className="mt-px size-3.5 shrink-0" />
            {screen.lockReason}
          </p>
        )}

        <PasscodeInput
          label={copy.title}
          value={screen.value}
          onChange={screen.change}
          disabled={screen.busy || screen.coolingDown}
          invalid={screen.error !== null}
        />

        <div className="flex min-h-5 flex-col items-center gap-2">
          {screen.busy ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Checking" />
          ) : (
            message && (
              <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {message}
              </p>
            )
          )}
          {!screen.busy && (screen.step === 'confirm' || screen.replacing) && (
            <div className="flex items-center gap-1">
              {screen.step === 'confirm' && (
                <Button type="button" variant="link" size="sm" onClick={screen.restart}>
                  Start over
                </Button>
              )}
              {screen.replacing && (
                <Button type="button" variant="link" size="sm" onClick={screen.cancelReset}>
                  Cancel and keep current passcode
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
