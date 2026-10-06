import { useEffect, useState } from 'react'
import { ACTIVITY_WEEKS } from '@/constants/daily-log'
import { shiftDateKey, toDateKey } from '@/constants/time-format'
import { useNow } from '@/hooks/use-now'
import { useDailyLogStore } from '@/store/daily-log-store'
import { useSyncScheduleStore } from '@/store/sync-schedule-store'

/** 'synced' days can be picked for resync; 'pending' ones already wait for the next sync. */
export type ResyncDayState = 'none' | 'synced' | 'pending'

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
    return entries.every((e) => e.synced) ? 'synced' : 'pending'
  }

  const submit = async () => {
    if (selected.length === 0) return
    setSaving(true)
    const message = await markDays(selected)
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
    selected,
    setSelected,
    saving,
    error,
    submit,
  }
}
