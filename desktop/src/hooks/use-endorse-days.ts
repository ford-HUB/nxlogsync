import { useEffect, useState } from 'react'
import { ACTIVITY_WEEKS, DAILY_LIMIT_MINUTES, workMinutes } from '@/constants/daily-log'
import { shiftDateKey, toDateKey } from '@/constants/time-format'
import { useNow } from '@/hooks/use-now'
import type { ResyncDayState } from '@/hooks/use-resync-days'
import { endorseDay } from '@/services/sync-service'
import { useDailyLogStore } from '@/store/daily-log-store'
import type { EndorseDayResult } from '@/types/sync-schedule'

/**
 * The Endorse days dialog: pick days whose entries are all synced to N-PAX,
 * confirm, and endorse them one at a time. Endorsing can't be undone.
 */
export function useEndorseDays(open: boolean) {
  const todayKey = toDateKey(useNow())
  const entriesByDate = useDailyLogStore((s) => s.entriesByDate)
  const loading = useDailyLogStore((s) => s.loading || !s.initialized)
  const fetchEntries = useDailyLogStore((s) => s.fetchEntries)
  const [selected, setSelected] = useState<string[]>([])
  const [results, setResults] = useState<Record<string, EndorseDayResult>>({})
  const [running, setRunning] = useState(false)

  // Re-read on every opening so the synced flags reflect the latest sync.
  useEffect(() => {
    if (open) void fetchEntries(shiftDateKey(todayKey, -ACTIVITY_WEEKS * 7), todayKey)
  }, [open, fetchEntries, todayKey])

  // Each opening starts with nothing picked.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSelected([])
      setResults({})
    }
  }

  const dayState = (key: string): ResyncDayState => {
    const entries = entriesByDate[key] ?? []
    if (entries.length === 0) return 'none'
    return entries.every((e) => e.synced) ? 'synced' : 'pending'
  }

  /** Work logged on a day, lunch left out, as the 9h limit counts it. */
  const dayMinutes = (key: string) =>
    (entriesByDate[key] ?? []).reduce((sum, e) => sum + workMinutes(e.startMinutes, e.endMinutes), 0)

  const syncedDays = Object.keys(entriesByDate)
    .filter((key) => key <= todayKey && dayState(key) === 'synced')
    .sort()
  const allSelected = syncedDays.length > 0 && syncedDays.every((key) => selected.includes(key))

  /** Endorses the picked days in order; one failing doesn't stop the rest. */
  const endorse = async () => {
    if (selected.length === 0 || running) return
    const days = [...selected]
    setRunning(true)
    setResults(Object.fromEntries(days.map((d) => [d, { status: 'waiting' }])))
    for (const date of days) {
      setResults((r) => ({ ...r, [date]: { status: 'running' } }))
      const result = await endorseDay(date)
      setResults((r) => ({
        ...r,
        [date]: result.success
          ? { status: 'done', outcome: result.data.outcome }
          : { status: 'failed', message: result.message },
      }))
    }
    setRunning(false)
  }

  const finished = Object.keys(results).length > 0 && !running

  return {
    todayKey,
    loading,
    dayState,
    dayMinutes,
    /** Under 9h: the server will skip it rather than endorse it. */
    isShortDay: (key: string) => dayMinutes(key) < DAILY_LIMIT_MINUTES,
    selected,
    setSelected,
    syncedDays,
    allSelected,
    /** Picks every synced day, or clears the pick when they all are. */
    toggleAll: () => setSelected(allSelected ? [] : syncedDays),
    results,
    running,
    /** A run has ended; its results stay listed until the dialog closes. */
    finished,
    endorse,
  }
}
