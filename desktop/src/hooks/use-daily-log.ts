import { useCallback, useEffect, useMemo, useState } from 'react'
import { ACTIVITY_WEEKS, DAILY_LIMIT_MINUTES, NEAR_LIMIT_MINUTES } from '@/constants/daily-log'
import { shiftDateKey, toDateKey } from '@/constants/time-format'
import { useNow } from '@/hooks/use-now'
import { useDailyLogStore } from '@/store/daily-log-store'
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

  const reload = useCallback(
    () => fetchEntries(shiftDateKey(todayKey, -ACTIVITY_WEEKS * 7), todayKey),
    [fetchEntries, todayKey],
  )
  useEffect(() => {
    void reload()
  }, [reload])

  const entries = useMemo(
    () => [...(entriesByDate[dateKey] ?? [])].sort((a, b) => a.startMinutes - b.startMinutes),
    [entriesByDate, dateKey],
  )
  // Logged minutes per day, for the activity heatmap. Recomputed as entries change.
  const minutesByDate = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const [key, dayEntries] of Object.entries(entriesByDate)) {
      totals[key] = dayEntries.reduce((sum, e) => sum + (e.endMinutes - e.startMinutes), 0)
    }
    return totals
  }, [entriesByDate])

  const totalMinutes = entries.reduce((sum, e) => sum + (e.endMinutes - e.startMinutes), 0)
  const remainingMinutes = Math.max(0, DAILY_LIMIT_MINUTES - totalMinutes)
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
