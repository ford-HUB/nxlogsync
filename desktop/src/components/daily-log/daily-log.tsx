import { motion } from 'motion/react'
import { useCallback, useMemo, useState } from 'react'
import { ConnectNotice } from '@/components/feedback/connect-notice'
import { ErrorBanner } from '@/components/feedback/error-banner'
import { EntriesReportDialog } from '@/components/reports/entries-report-dialog'
import { CoffeeDialog } from '@/components/support/coffee-dialog'
import { useCompactWindow } from '@/hooks/use-compact-window'
import { useDailyLog } from '@/hooks/use-daily-log'
import { useIsSignedIn } from '@/hooks/use-site-session'
import { useTimeIn } from '@/hooks/use-time-in'
import { useTrashDrag } from '@/hooks/use-trash-drag'
import { useTrashRestoreDrag } from '@/hooks/use-trash-restore-drag'
import { planInsert } from '@/lib/insert-entry'
import { cn } from '@/lib/utils'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useTrashStore } from '@/store/trash-store'
import type { LogEntry } from '@/types/daily-log'
import { ActivityDialog } from './activity-dialog'
import { DayHeader } from './day-header'
import { EntryForm } from './entry-form'
import { EntryList } from './entry-list'
import { HoursSummary } from './hours-summary'
import { DraggedEntry } from './ui/dragged-entry'
import { SetAsideConfirm } from './ui/set-aside-confirm'
import { TrashBin } from './ui/trash-bin'
import { TypingDock } from '@/components/typing-test/typing-dock'

interface DailyLogProps {
  onOpenSettings: () => void
  onOpenTypingTest: () => void
}

export function DailyLog({ onOpenSettings, onOpenTypingTest }: DailyLogProps) {
  const log = useDailyLog()
  const signedIn = useIsSignedIn()
  const timeInMinutes = useTimeIn(log.dateKey, signedIn)
  const sessionLoaded = useSiteSessionStore((s) => s.loaded)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activityOpen, setActivityOpen] = useState(false)
  // The month the entries report opened on; null while it's closed.
  const [reportMonth, setReportMonth] = useState<string | null>(null)
  const userId = useSiteSessionStore((s) => s.target.userId)
  const trashItems = useTrashStore((s) => s.items)
  const myTrashItems = trashItems.filter((i) => i.userId === userId)
  const setAside = useTrashStore((s) => s.setAside)
  const { dateKey, todayKey } = log
  const setAsideEntry = useCallback(
    (entry: LogEntry) => {
      if (userId !== null) void setAside(userId, dateKey, entry)
    },
    [setAside, userId, dateKey],
  )
  // Only the first drag into the Trash each calendar day asks before setting the task aside.
  const needsSetAsideConfirm = useCallback(
    () => userId !== null && useTrashStore.getState().confirmedOn[userId] !== todayKey,
    [userId, todayKey],
  )
  const trash = useTrashDrag(setAsideEntry, needsSetAsideConfirm)
  const compactWindow = useCompactWindow()
  const confirmSetAside = () => {
    if (userId !== null) useTrashStore.getState().markConfirmed(userId, todayKey)
    trash.confirm()
  }
  // A task dragged out of the Trash onto the open day: it lands at the slot under the pointer.
  const restoreDrag = useTrashRestoreDrag({
    listRef: trash.zoneRef,
    binRef: trash.trashRef,
    onDrop: (item, index) => {
      const plan = planInsert(log.entries, item.entry, index)
      if (plan) void useTrashStore.getState().placeInDay(item, dateKey, plan)
      return plan !== null
    },
  })
  const restoreItem = restoreDrag.item
  const restoreIndex = restoreDrag.index
  const restoreDrop = useMemo(
    () =>
      restoreItem && restoreIndex !== null
        ? { index: restoreIndex, plan: planInsert(log.entries, restoreItem.entry, restoreIndex) }
        : null,
    [restoreItem, restoreIndex, log.entries],
  )
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

  const trashBin = signedIn && log.initialized && (
    <TrashBin
      inline={compactWindow}
      ref={trash.trashRef}
      ready={trash.phase === 'dragging' || trash.phase === 'confirming' || trash.phase === 'consuming'}
      over={trash.overTrash}
      consumedCount={trash.consumedCount}
      items={myTrashItems}
      onRestore={(item) => void useTrashStore.getState().restore(item)}
      onDiscard={useTrashStore.getState().discard}
      onEmpty={() => {
        if (userId !== null) useTrashStore.getState().empty(userId)
      }}
      onPickItem={restoreDrag.press}
    />
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
        entryCountByDate={log.entryCountByDate}
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

        <div ref={trash.zoneRef}>
          <EntryList
            dateKey={log.dateKey}
            entries={log.entries}
            initialized={log.initialized}
            highlightedId={highlightedId}
            editingId={editingEntry?.id ?? null}
            onHighlight={setHighlightedId}
            onSelect={toggleEditing}
            onRemove={log.removeEntry}
            grabbedId={trash.entry?.id ?? null}
            onGrab={trash.grab}
            drop={restoreDrop}
          />
        </div>
      </fieldset>

      {/* The drop zone: everything past the task list's border on the bin's side, glowing while a task is dragged. */}
      {trash.entry && trash.zoneEdge && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: trash.overTrash ? 1 : 0.45 }}
          transition={{ duration: 0.15 }}
          style={
            trash.zoneEdge.side === 'right'
              ? { left: trash.zoneEdge.x, right: 0 }
              : { left: 0, width: trash.zoneEdge.x }
          }
          className={cn(
            'pointer-events-none fixed inset-y-0 z-30 border-dashed border-foreground/40 from-foreground/0 to-foreground/10',
            trash.zoneEdge.side === 'right' ? 'border-l-2 bg-gradient-to-r' : 'border-r-2 bg-gradient-to-l',
          )}
        />
      )}

      {/* A compact window has no room beside the content column, so both sit under the task list. */}
      {compactWindow ? (
        <div className="flex items-end justify-end gap-6 px-2">
          <TypingDock inline onOpen={onOpenTypingTest} />
          {trashBin}
        </div>
      ) : (
        <>
          {trashBin}
          {/* Out of the way while a task is dragged toward the Trash. */}
          {!trash.entry && <TypingDock onOpen={onOpenTypingTest} />}
        </>
      )}
      {trash.entry && <DraggedEntry entry={trash.entry} over={trash.overTrash} {...trash.motion} />}
      <SetAsideConfirm
        entry={trash.phase === 'confirming' ? trash.entry : null}
        onConfirm={confirmSetAside}
        onCancel={trash.cancel}
      />
      {restoreItem && (
        <DraggedEntry entry={restoreItem.entry} over={restoreDrop?.plan != null} {...restoreDrag.motion} />
      )}
    </div>
  )
}
