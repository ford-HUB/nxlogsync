import { ConnectNotice } from '@/components/feedback/connect-notice'
import { ErrorBanner } from '@/components/feedback/error-banner'
import { useIsSignedIn } from '@/hooks/use-site-session'
import { useSyncSchedule, type SyncScheduleState } from '@/hooks/use-sync-schedule'
import { cn } from '@/lib/utils'
import { useSiteSessionStore } from '@/store/site-session-store'
import { RunHistory } from './run-history'
import { ScheduleForm } from './schedule-form'
import { ScheduleHeader } from './schedule-header'
import { SyncStatusSummary } from './sync-status-summary'
import { TargetSiteCard } from './target-site-card'
import { SaveBar } from './ui/save-bar'
import { SyncScheduleSkeleton } from './ui/sync-schedule-skeleton'

interface SyncScheduleProps {
  onBack: () => void
  onLogout: () => void
  onResetPasscode: (current: string) => Promise<boolean>
}

export function SyncSchedule({ onBack, onLogout, onResetPasscode }: SyncScheduleProps) {
  const schedule = useSyncSchedule()
  const signedIn = useIsSignedIn()
  const sessionLoaded = useSiteSessionStore((s) => s.loaded)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <ScheduleHeader onBack={onBack} onLogout={onLogout} onResetPasscode={onResetPasscode} locked={!signedIn} />
      {sessionLoaded && !signedIn && <ConnectNotice />}
      {schedule.error && (
        <ErrorBanner
          message={schedule.error}
          onRetry={schedule.hasSchedule ? undefined : () => void schedule.reload()}
          onDismiss={schedule.hasSchedule ? schedule.dismissError : undefined}
        />
      )}
      {/* Signed out there is no schedule to load: show the defaults, locked, so Connect is reachable. */}
      {schedule.hasSchedule || !signedIn ? (
        <ScheduleBody schedule={schedule} locked={!signedIn} />
      ) : (
        !schedule.error && <SyncScheduleSkeleton />
      )}
    </div>
  )
}

/** Until a site user is signed in, only Connect (on the target card) stays usable. */
function ScheduleBody({ schedule, locked }: { schedule: SyncScheduleState; locked: boolean }) {
  const lockClass = cn('contents', locked && 'pointer-events-none')

  return (
    <>
      <fieldset disabled={locked} className={lockClass}>
        <SyncStatusSummary schedule={schedule} />
      </fieldset>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <fieldset disabled={locked} className={lockClass}>
          <ScheduleForm schedule={schedule} />
        </fieldset>
        <div className="flex flex-col gap-4">
          <TargetSiteCard schedule={schedule} />
          <fieldset disabled={locked} className={lockClass}>
            <RunHistory runs={schedule.runs} now={schedule.now} />
          </fieldset>
        </div>
      </div>

      {schedule.isDirty && !locked && (
        <SaveBar
          canSave={schedule.issue === null && !schedule.saving}
          onSave={schedule.save}
          onDiscard={schedule.discard}
        />
      )}
    </>
  )
}
