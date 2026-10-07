import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACTIVITY_WEEKS, DAILY_LIMIT_MINUTES, NEAR_LIMIT_MINUTES, workMinutes } from '@/constants/daily-log'
import { shiftDateKey, toDateKey } from '@/constants/time-format'
import { useNow } from '@/hooks/use-now'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useDailyLogStore } from '@/store/daily-log-store'
import { useJobsStore } from '@/store/jobs-store'
import { useSyncScheduleStore } from '@/store/sync-schedule-store'
import type { DayStatus, EntryDraft } from '@/types/daily-log'

function getDayStatus(totalMinutes: number, entryCount: number): DayStatus {
  if (entryCount === 0) return 'empty'
  if (totalMinutes > DAILY_LIMIT_MINUTES) return 'over-limit'
  if (totalMinutes === DAILY_LIMIT_MINUTES) return 'full'
  if (DAILY_LIMIT_MINUTES - totalMinutes <= NEAR_LIMIT_MINUTES) return 'near-limit'
  return 'in-progress'
}

/**
 * The daily log screen: entries come from the server, loaded once for the whole
 * heatmap range (every day the screen can open), and saved through the store.
 */
export function useDailyLog() {
  // Follows the clock past midnight, which also reloads the heatmap range.
  const todayKey = toDateKey(useNow())
  const [dateKey, setDateKey] = useState(todayKey)
  const entriesByDate = useDailyLogStore((s) => s.entriesByDate)
  const initialized = useDailyLogStore((s) => s.initialized)
  const error = useDailyLogStore((s) => s.error)
  const fetchEntries = useDailyLogStore((s) => s.fetchEntries)
  const saveNew = useDailyLogStore((s) => s.addEntry)
  const saveChange = useDailyLogStore((s) => s.updateEntry)
  const remove = useDailyLogStore((s) => s.removeEntry)
  const dismissError = useDailyLogStore((s) => s.dismissError)
  const reset = useDailyLogStore((s) => s.reset)

  const reload = useCallback(
    () => fetchEntries(shiftDateKey(todayKey, -ACTIVITY_WEEKS * 7), todayKey),
    [fetchEntries, todayKey],
  )
  // Entries belong to the signed-in site user: load once one connects, again if the user
  // changes, and drop them on sign-out.
  const userId = useSiteSessionStore((s) => s.target.userId)
  useEffect(() => {
    if (userId !== null) void reload()
    else reset()
  }, [reload, reset, userId])

  // N-PAX lists different jobs per employee, so the Job lookup is the user's own.
  const fetchJobs = useJobsStore((s) => s.fetchJobs)
  const resetJobs = useJobsStore((s) => s.reset)
  useEffect(() => {
    if (userId !== null) void fetchJobs()
    else resetJobs()
  }, [fetchJobs, resetJobs, userId])

  // A finished sync changes which entries are synced; reload to show it.
  const latestRun = useSyncScheduleStore((s) => s.runs[0])
  const finishedRunKey = latestRun && latestRun.status !== 'running' ? `${latestRun.id}:${latestRun.status}` : null
  const [seenRunKey, setSeenRunKey] = useState(finishedRunKey)
  useEffect(() => {
    if (finishedRunKey === seenRunKey) return
    setSeenRunKey(finishedRunKey)
    if (seenRunKey !== null && userId !== null) void reload()
  }, [finishedRunKey, seenRunKey, reload, userId])

  const entries = useMemo(
    () => [...(entriesByDate[dateKey] ?? [])].sort((a, b) => a.startMinutes - b.startMinutes),
    [entriesByDate, dateKey],
  )
  // Logged minutes per day, for the activity heatmap. Recomputed as entries change.
  const minutesByDate = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const [key, dayEntries] of Object.entries(entriesByDate)) {
      totals[key] = dayEntries.reduce((sum, e) => sum + workMinutes(e.startMinutes, e.endMinutes), 0)
    }
    return totals
  }, [entriesByDate])

  const totalMinutes = entries.reduce((sum, e) => sum + workMinutes(e.startMinutes, e.endMinutes), 0)
  const remainingMinutes = Math.max(0, DAILY_LIMIT_MINUTES - totalMinutes)
  const overtimeMinutes = Math.max(0, totalMinutes - DAILY_LIMIT_MINUTES)
  const status = getDayStatus(totalMinutes, entries.length)

  const addEntry = useCallback((draft: EntryDraft) => void saveNew(dateKey, draft), [saveNew, dateKey])
  const updateEntry = useCallback(
    (id: string, draft: EntryDraft) => void saveChange(dateKey, id, draft),
    [saveChange, dateKey],
  )
  const removeEntry = useCallback((id: string) => void remove(dateKey, id), [remove, dateKey])

  // Keys are zero-padded "YYYY-MM-DD", so string order is date order. Stable for memoised heatmap cells.
  const goToDate = useCallback((key: string) => setDateKey(key > todayKey ? todayKey : key), [todayKey])

  const isToday = dateKey === todayKey

  return {
    initialized,
    error,
    dismissError,
    reload,
    dateKey,
    todayKey,
    isToday,
    minutesByDate,
    entries,
    totalMinutes,
    remainingMinutes,
    overtimeMinutes,
    status,
    addEntry,
    updateEntry,
    removeEntry,
    goToPreviousDay: () => setDateKey((k) => shiftDateKey(k, -1)),
    goToNextDay: () => setDateKey((k) => (k === todayKey ? k : shiftDateKey(k, 1))),
    goToToday: () => setDateKey(todayKey),
    goToDate,
  }
}
