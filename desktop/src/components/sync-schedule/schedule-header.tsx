import { ArrowLeft, LogOut } from 'lucide-react'
import { ResetPasscodeDialog } from '@/components/passcode/reset-passcode-dialog'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'

interface ScheduleHeaderProps {
  onBack: () => void
  /** Locks the app; the passcode is needed to get back in. */
  onLogout: () => void
  onResetPasscode: (current: string) => Promise<boolean>
  /** Disables everything except Back and Log out (no site user signed in yet). */
  locked?: boolean
}

export function ScheduleHeader({ onBack, onLogout, onResetPasscode, locked = false }: ScheduleHeaderProps) {
  return (
    <header className="flex items-center gap-3">
      <Button type="button" variant="outline" size="icon" aria-label="Back to daily log" onClick={onBack}>
        <ArrowLeft />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Sync schedule</h1>
        <p className="truncate text-[13px] text-muted-foreground">
          Settings · When NXLogSync uploads your logged hours to the target site
        </p>
      </div>
      <ResetPasscodeDialog onReset={onResetPasscode} disabled={locked} />
      <Button type="button" variant="outline" onClick={onLogout}>
        <LogOut />
        Log out
      </Button>
      <ThemeToggle />
    </header>
  )
}
