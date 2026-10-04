import { SyncSchedule } from '@/components/sync-schedule/sync-schedule'

interface SettingsPageProps {
  onBack: () => void
  onLogout: () => void
  onResetPasscode: (current: string) => Promise<boolean>
}

export function SettingsPage({ onBack, onLogout, onResetPasscode }: SettingsPageProps) {
  return (
    <main className="min-h-dvh bg-muted/40 lg:h-dvh lg:overflow-y-auto">
      <SyncSchedule onBack={onBack} onLogout={onLogout} onResetPasscode={onResetPasscode} />
    </main>
  )
}
