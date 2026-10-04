import { ErrorBanner } from '@/components/feedback/error-banner'
import { useSyncSchedule, type SyncScheduleState } from '@/hooks/use-sync-schedule'
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <ScheduleHeader onBack={onBack} onLogout={onLogout} onResetPasscode={onResetPasscode} />
      {schedule.error && (
        <ErrorBanner
          message={schedule.error}
          onRetry={schedule.hasSchedule ? undefined : () => void schedule.reload()}
          onDismiss={schedule.hasSchedule ? schedule.dismissError : undefined}
        />
      )}
      {schedule.hasSchedule ? <ScheduleBody schedule={schedule} /> : !schedule.error && <SyncScheduleSkeleton />}
    </div>
  )
}

function ScheduleBody({ schedule }: { schedule: SyncScheduleState }) {
  return (
    <>
      <SyncStatusSummary schedule={schedule} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ScheduleForm schedule={schedule} />
        <div className="flex flex-col gap-4">
          <TargetSiteCard schedule={schedule} />
          <RunHistory runs={schedule.runs} now={schedule.now} />
        </div>
      </div>

      {schedule.isDirty && (
        <SaveBar
          canSave={schedule.issue === null && !schedule.saving}
          onSave={schedule.save}
          onDiscard={schedule.discard}
        />
      )}
    </>
  )
}
