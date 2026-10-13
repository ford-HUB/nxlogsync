import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { UpdateScreen } from '@/components/app-update/update-screen'
import { VersionBadge } from '@/components/changelog/version-badge'
import { HiddenReportSwipe } from '@/components/excel-report/ui/hidden-report-swipe'
import { PasscodeScreen } from '@/components/passcode/passcode-screen'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePasscodeExpiry } from '@/hooks/use-passcode-expiry'
import { useSiteSessionPolling } from '@/hooks/use-site-session'
import { ChangelogPage } from '@/pages/changelog-page'
import { DailyLogPage } from '@/pages/daily-log-page'
import { ExcelReportPage } from '@/pages/excel-report-page'
import { RunYourselfPage } from '@/pages/run-yourself-page'
import { SettingsPage } from '@/pages/settings-page'
import { TetrisPage } from '@/pages/tetris-page'
import { TypingTestPage } from '@/pages/typing-test-page'
import { usePasscodeStore } from '@/store/passcode-store'

type AppView = 'daily-log' | 'settings' | 'typing-test' | 'tetris' | 'run-yourself' | 'excel-report' | 'changelog'

/** The app, with the update screen over everything, the passcode screen included. */
function App() {
  return (
    <>
      <AppScreens />
      <UpdateScreen />
    </>
  )
}

function AppScreens() {
  // No router yet: a few screens, switched in memory.
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
      {view === 'settings' || view === 'changelog' ? (
        <>
          <SettingsPage onBack={() => setView('daily-log')} onLogout={() => lock()} onResetPasscode={resetPasscode} />
          {view === 'settings' && <VersionBadge onOpen={() => setView('changelog')} />}
          <AnimatePresence>
            {view === 'changelog' && <ChangelogPage key="changelog" onBack={() => setView('settings')} />}
          </AnimatePresence>
        </>
      ) : (
        <>
          <DailyLogPage
            onOpenSettings={() => setView('settings')}
            onOpenTypingTest={() => setView('typing-test')}
            onOpenTetris={() => setView('tetris')}
            onOpenRunYourself={() => setView('run-yourself')}
          />
          {view === 'daily-log' && <HiddenReportSwipe onOpen={() => setView('excel-report')} />}
          <AnimatePresence>
            {view === 'typing-test' && <TypingTestPage
                key="typing-test"
                onBack={() => setView('daily-log')}
                onOpenSettings={() => setView('settings')}
              />}
            {view === 'tetris' && <TetrisPage key="tetris" onBack={() => setView('daily-log')} />}
            {view === 'run-yourself' && <RunYourselfPage key="run-yourself" onBack={() => setView('daily-log')} />}
            {view === 'excel-report' && <ExcelReportPage key="excel-report" onBack={() => setView('daily-log')} />}
          </AnimatePresence>
        </>
      )}
    </TooltipProvider>
  )
}

export default App
