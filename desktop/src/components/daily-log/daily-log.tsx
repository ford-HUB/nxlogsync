import { useCallback, useState } from 'react'
import { ConnectNotice } from '@/components/feedback/connect-notice'
import { ErrorBanner } from '@/components/feedback/error-banner'
import { EntriesReportDialog } from '@/components/reports/entries-report-dialog'
import { CoffeeDialog } from '@/components/support/coffee-dialog'
import { useDailyLog } from '@/hooks/use-daily-log'
import { useIsSignedIn } from '@/hooks/use-site-session'
import { useTimeIn } from '@/hooks/use-time-in'
import { cn } from '@/lib/utils'
import { useSiteSessionStore } from '@/store/site-session-store'
import { ActivityDialog } from './activity-dialog'
import { DayHeader } from './day-header'
import { EntryForm } from './entry-form'
import { EntryList } from './entry-list'
import { HoursSummary } from './hours-summary'

interface DailyLogProps {
  onOpenSettings: () => void
}

export function DailyLog({ onOpenSettings }: DailyLogProps) {
  const log = useDailyLog()
  const signedIn = useIsSignedIn()
  const timeInMinutes = useTimeIn(log.dateKey, signedIn)
  const sessionLoaded = useSiteSessionStore((s) => s.loaded)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activityOpen, setActivityOpen] = useState(false)
  // The month the entries report opened on; null while it's closed.
  const [reportMonth, setReportMonth] = useState<string | null>(null)
  // Resolves to null if the entry is deleted or the day changes, which ends editing.
  const editingEntry = log.entries.find((e) => e.id === editingId) ?? null
  const stopEditing = () => setEditingId(null)
  const changeDay = (go: () => void) => {
    stopEditing()
    go()
  }

  const { goToDate } = log
  const openDay = useCallback(
    (key: string) => {
      setEditingId(null)
      goToDate(key)
      setActivityOpen(false)
    },
    [goToDate],
  )

  // Clicking the row being edited again puts the form back into "new entry" mode.
  const toggleEditing = (id: string) => setEditingId((current) => (current === id ? null : id))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <DayHeader
        dateKey={log.dateKey}
        todayKey={log.todayKey}
        isToday={log.isToday}
        minutesByDate={log.minutesByDate}
        onPrevious={() => changeDay(log.goToPreviousDay)}
        onNext={() => changeDay(log.goToNextDay)}
        onToday={() => changeDay(log.goToToday)}
        onSelectDay={openDay}
        onOpenActivity={() => setActivityOpen(true)}
        onOpenSettings={onOpenSettings}
        onOpenReport={setReportMonth}
        locked={!signedIn}
      />

      {sessionLoaded && !signedIn && <ConnectNotice onOpenSettings={onOpenSettings} />}

      {log.error && (
        <ErrorBanner
          message={log.error}
          onRetry={log.initialized && Object.keys(log.minutesByDate).length === 0 ? () => void log.reload() : undefined}
          onDismiss={log.dismissError}
        />
      )}

      <ActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        todayKey={log.todayKey}
        selectedKey={log.dateKey}
        minutesByDate={log.minutesByDate}
        onSelectDay={openDay}
      />

      <EntriesReportDialog month={signedIn ? reportMonth : null} onClose={() => setReportMonth(null)} />

      <CoffeeDialog />

      {/* Entries belong to the signed-in site user, so nothing below works until one connects. */}
      <fieldset disabled={!signedIn} className={cn('contents', !signedIn && 'pointer-events-none')}>
        <HoursSummary
          entries={log.entries}
          totalMinutes={log.totalMinutes}
          remainingMinutes={log.remainingMinutes}
          overtimeMinutes={log.overtimeMinutes}
          status={log.status}
          highlightedId={highlightedId}
          onHighlight={setHighlightedId}
        />

        {/* Remount per day so the draft re-suggests times from that day's entries
            (an unsaved description is cached per day and comes back). */}
        <EntryForm
          key={log.dateKey}
          dateKey={log.dateKey}
          entries={log.entries}
          remainingMinutes={log.remainingMinutes}
          overtimeMinutes={log.overtimeMinutes}
          timeInMinutes={timeInMinutes}
          isToday={log.isToday}
          editingEntry={editingEntry}
          onAdd={log.addEntry}
          onUpdate={(id, draft) => {
            log.updateEntry(id, draft)
            stopEditing()
          }}
          onCancelEdit={stopEditing}
        />

        <EntryList
          dateKey={log.dateKey}
          entries={log.entries}
          initialized={log.initialized}
          highlightedId={highlightedId}
          editingId={editingEntry?.id ?? null}
          onHighlight={setHighlightedId}
          onSelect={toggleEditing}
          onRemove={log.removeEntry}
        />
      </fieldset>
    </div>
  )
}
