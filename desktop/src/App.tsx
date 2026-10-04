import { useEffect, useState } from 'react'
import { PasscodeScreen } from '@/components/passcode/passcode-screen'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePasscodeExpiry } from '@/hooks/use-passcode-expiry'
import { useSiteSessionPolling } from '@/hooks/use-site-session'
import { DailyLogPage } from '@/pages/daily-log-page'
import { SettingsPage } from '@/pages/settings-page'
import { usePasscodeStore } from '@/store/passcode-store'

type AppView = 'daily-log' | 'settings'

function App() {
  // No router yet: two screens, switched in memory.
  const [view, setView] = useState<AppView>('daily-log')
  const status = usePasscodeStore((s) => s.status)
  const lock = usePasscodeStore((s) => s.lock)
  const resetPasscode = usePasscodeStore((s) => s.resetPasscode)
  usePasscodeExpiry()
  useSiteSessionPolling()

  // Unlocking after a lock lands on the daily log; finishing or cancelling a reset returns to Settings.
  useEffect(() => {
    if (status === 'locked') setView('daily-log')
  }, [status])

  if (status !== 'unlocked') return <PasscodeScreen />

  return (
    <TooltipProvider delayDuration={150}>
      {view === 'settings' ? (
        <SettingsPage onBack={() => setView('daily-log')} onLogout={() => lock()} onResetPasscode={resetPasscode} />
      ) : (
        <DailyLogPage onOpenSettings={() => setView('settings')} />
      )}
    </TooltipProvider>
  )
}

export default App
