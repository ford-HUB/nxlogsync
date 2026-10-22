import { useEffect, useState } from 'react'
import { ACTIVITY_WEEKS } from '@/constants/daily-log'
import { shiftDateKey, toDateKey } from '@/constants/time-format'
import { useNow } from '@/hooks/use-now'
import { useDailyLogStore } from '@/store/daily-log-store'
import { useSyncScheduleStore } from '@/store/sync-schedule-store'

/**
 * 'synced' days can be picked for resync; 'pending' ones already wait for the next sync;
 * 'endorsed' ones are with the checker on N-PAX and can't be uploaded again.
 */
export type ResyncDayState = 'none' | 'synced' | 'pending' | 'endorsed'

/**
 * The Resync days dialog: pick synced days and mark them in the database for
 * upload again. Nothing is sent to N-PAX until the next sync runs.
 */
export function useResyncDays(open: boolean, onDone: () => void) {
  const todayKey = toDateKey(useNow())
  const entriesByDate = useDailyLogStore((s) => s.entriesByDate)
  const loading = useDailyLogStore((s) => s.loading || !s.initialized)
  const fetchEntries = useDailyLogStore((s) => s.fetchEntries)
  const markDays = useDailyLogStore((s) => s.resyncDays)
  const refreshActivity = useSyncScheduleStore((s) => s.refreshActivity)
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-read on every opening: a sync that finished while the Daily Log wasn't
  // mounted never reloaded the store, so its synced flags may be stale.
  useEffect(() => {
    if (open) void fetchEntries(shiftDateKey(todayKey, -ACTIVITY_WEEKS * 7), todayKey)
  }, [open, fetchEntries, todayKey])

  // Each opening starts with nothing picked.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSelected([])
      setError(null)
    }
  }

  const dayState = (key: string): ResyncDayState => {
    const entries = entriesByDate[key] ?? []
    if (entries.length === 0) return 'none'
    // With the checker on N-PAX: it can't be uploaded again.
    if (entries.some((e) => e.endorsed)) return 'endorsed'
    return entries.every((e) => e.synced) ? 'synced' : 'pending'
  }

  /** Times the day was marked for resync; entries added since start at 0, so take the highest. */
  const resyncCount = (key: string) => Math.max(0, ...(entriesByDate[key] ?? []).map((e) => e.resyncCount))

  // Only synced days may be marked: a day endorsed since it was picked is dropped, never sent.
  const picked = selected.filter((key) => dayState(key) === 'synced')

  const submit = async () => {
    if (picked.length === 0) return
    setSaving(true)
    const message = await markDays(picked)
    setSaving(false)
    if (message) {
      setError(message)
      return
    }
    void refreshActivity()
    onDone()
  }

  return {
    todayKey,
    loading,
    dayState,
    resyncCount,
    selected: picked,
    setSelected,
    saving,
    error,
    submit,
  }
}
