import { KeyRound, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TARGET_SITE_NAME } from '@/constants/sync-schedule'

interface ConnectNoticeProps {
  /** Shows a shortcut to Settings; omit on the Settings screen itself. */
  onOpenSettings?: () => void
}

/** Shown while no site user is signed in: every action stays disabled until one connects. */
export function ConnectNotice({ onOpenSettings }: ConnectNoticeProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl bg-background px-4 py-2.5 text-[13px] shadow-sm ring-1 ring-border"
    >
      <KeyRound className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        Connect to the {TARGET_SITE_NAME} to get started — your log entries are saved under that account.
        {!onOpenSettings && ' Use Connect on the Target site card below.'}
      </span>
      {onOpenSettings && (
        <Button type="button" size="sm" onClick={onOpenSettings}>
          <Settings />
          Open Settings
        </Button>
      )}
    </div>
  )
}
