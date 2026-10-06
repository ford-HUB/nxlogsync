import { useCallback, useEffect, useState } from 'react'
import {
  ACTIVE_RUN_POLL_MS,
  FALLBACK_SCHEDULE,
  RUNS_POLL_MS,
  UPCOMING_LOOKAHEAD_DAYS,
  UPCOMING_LOOKAHEAD_MONTHS,
  UPCOMING_PREVIEW_COUNT,
} from '@/constants/sync-schedule'
import { useNow } from '@/hooks/use-now'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useSyncScheduleStore } from '@/store/sync-schedule-store'
import type { ScheduleIssue, ScheduleState, SyncSchedule, Weekday } from '@/types/sync-schedule'

function runTimesForDay(schedule: SyncSchedule): number[] {
  if (schedule.mode === 'daily') return [schedule.dailyAtMinutes]
  const times: number[] = []
  const step = schedule.intervalHours * 60
  for (let t = schedule.windowStartMinutes; t <= schedule.windowEndMinutes; t += step) times.push(t)
  return times
}

/** The monthly run in `month` (0-based; overflow rolls into the next year, like the Date constructor). */
function monthlyRunFor(schedule: SyncSchedule, year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const run = new Date(year, month, Math.max(1, lastDay - schedule.monthlyDaysBeforeEnd))
  if (schedule.monthlyWeekdaysOnly) {
    // Sat → Fri (-1), Sun → Fri (-2). Offsets top out at 7 days, so this never leaves the month.
    const weekday = run.getDay()
    if (weekday === 6) run.setDate(run.getDate() - 1)
    if (weekday === 0) run.setDate(run.getDate() - 2)
  }
  run.setMinutes(schedule.dailyAtMinutes)
  return run
}

/** The next `count` automatic runs after `now`; empty when paused, manual, or no days are picked. */
export function getUpcomingRuns(schedule: SyncSchedule, now: Date, count: number): Date[] {
  if (!schedule.enabled || schedule.mode === 'manual' || getScheduleIssue(schedule) !== null) return []
  const runs: Date[] = []
  if (schedule.mode === 'monthly') {
    for (let offset = 0; offset < UPCOMING_LOOKAHEAD_MONTHS && runs.length < count; offset++) {
      const run = monthlyRunFor(schedule, now.getFullYear(), now.getMonth() + offset)
      if (run > now) runs.push(run)
    }
    return runs
  }
  const times = runTimesForDay(schedule)
  for (let offset = 0; offset < UPCOMING_LOOKAHEAD_DAYS && runs.length < count; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    if (!schedule.days.includes(day.getDay() as Weekday)) continue
    for (const minutes of times) {
      const run = new Date(day)
      run.setMinutes(minutes)
      if (run > now) runs.push(run)
      if (runs.length === count) break
    }
  }
  return runs
}

function getScheduleIssue(schedule: SyncSchedule): ScheduleIssue | null {
  if (!/^https:\/\/\S+\.\S+/.test(schedule.targetUrl.trim())) return 'invalid-url'
  if (schedule.mode === 'manual' || schedule.mode === 'monthly') return null
  if (schedule.days.length === 0) return 'no-days'
  if (schedule.mode === 'interval' && schedule.windowEndMinutes <= schedule.windowStartMinutes) return 'window-order'
  return null
}

function getScheduleState(schedule: SyncSchedule): ScheduleState {
  if (schedule.mode === 'manual') return 'manual'
  return schedule.enabled ? 'scheduled' : 'paused'
}

const sameSchedule = (a: SyncSchedule, b: SyncSchedule) => JSON.stringify(a) === JSON.stringify(b)

/**
 * State for the sync schedule screen. The schedule, run history and pending
 * minutes live on the server, which also fires scheduled runs and does the
 * uploads; edits stay in a local draft until saved. The server also holds the
 * N-PAX session, keeps it alive, and re-logs in when it expires; the app-wide
 * session store polls its status.
 */
export function useSyncSchedule() {
  const now = useNow()
  const serverSchedule = useSyncScheduleStore((s) => s.schedule)
  const runs = useSyncScheduleStore((s) => s.runs)
  const pending = useSyncScheduleStore((s) => s.pending)
  const initialized = useSyncScheduleStore((s) => s.initialized)
  const saving = useSyncScheduleStore((s) => s.saving)
  const error = useSyncScheduleStore((s) => s.error)
  const fetchAll = useSyncScheduleStore((s) => s.fetchAll)
  const refreshActivity = useSyncScheduleStore((s) => s.refreshActivity)
  const persist = useSyncScheduleStore((s) => s.saveSchedule)
  const startRun = useSyncScheduleStore((s) => s.startRun)
  const dismissError = useSyncScheduleStore((s) => s.dismissError)
  const reset = useSyncScheduleStore((s) => s.reset)

  const saved = serverSchedule ?? FALLBACK_SCHEDULE
  const [draft, setDraft] = useState(saved)
  const target = useSiteSessionStore((s) => s.target)
  const testConnection = useSiteSessionStore((s) => s.testConnection)
  const connect = useSiteSessionStore((s) => s.connect)
  const logout = useSiteSessionStore((s) => s.logout)

  // Reset the draft whenever the server's copy changes (first load, or after a save).
  const [loadedSchedule, setLoadedSchedule] = useState(serverSchedule)
  if (serverSchedule !== loadedSchedule) {
    setLoadedSchedule(serverSchedule)
    if (serverSchedule) setDraft(serverSchedule)
  }

  // The schedule, runs and pending minutes are the signed-in user's; signed out, the
  // screen shows the defaults (locked) until someone connects.
  const signedIn = target.userId !== null
  useEffect(() => {
    if (signedIn) void fetchAll()
    else reset()
  }, [fetchAll, reset, signedIn, target.userId])

  const update = useCallback(
    (patch: Partial<SyncSchedule>) =>
      setDraft((d) => {
        // Leaving manual for a timed mode means the user wants it to run, so switch it on.
        const turnsOn = patch.mode !== undefined && patch.mode !== 'manual' && d.mode === 'manual'
        return { ...d, ...(turnsOn && { enabled: true }), ...patch }
      }),
    [],
  )

  const toggleDay = useCallback((day: Weekday) => {
    setDraft((d) => ({ ...d, days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day] }))
  }, [])

  const issue = getScheduleIssue(draft)
  const isDirty = !sameSchedule(saved, draft)
  const isSyncing = runs[0]?.status === 'running'
  const finishedRuns = runs.filter((r) => r.status !== 'running')
  const lastRun = finishedRuns[0] ?? null

  const syncNow = () => {
    if (isSyncing) return
    void startRun()
  }

  // Scheduled runs start on the server, so keep re-reading; faster while one is in flight.
  useEffect(() => {
    if (!initialized || !signedIn) return
    const id = window.setInterval(() => void refreshActivity(), isSyncing ? ACTIVE_RUN_POLL_MS : RUNS_POLL_MS)
    return () => window.clearInterval(id)
  }, [initialized, signedIn, isSyncing, refreshActivity])

  return {
    initialized,
    hasSchedule: serverSchedule !== null,
    saving,
    error,
    dismissError,
    reload: fetchAll,
    now,
    saved,
    draft,
    target,
    runs,
    lastRun,
    pending,
    issue,
    isDirty,
    isSyncing,
    // The summary follows the draft so a mode change shows up before Save; isDirty marks it unsaved.
    state: getScheduleState(draft),
    nextRun: getUpcomingRuns(draft, now, 1)[0] ?? null,
    previewRuns: getUpcomingRuns(draft, now, UPCOMING_PREVIEW_COUNT),
    successCount: finishedRuns.filter((r) => r.status === 'success').length,
    finishedCount: finishedRuns.length,
    update,
    toggleDay,
    save: () => {
      if (issue === null && !saving) void persist(draft)
    },
    discard: () => setDraft(saved),
    // With nothing else pending, the header switch takes effect immediately, like a pause
    // button. With unsaved edits (e.g. a new mode) it joins the draft and goes in with Save,
    // so it never saves the old mode behind the user's back.
    setEnabled: (enabled: boolean) => {
      if (isDirty || !serverSchedule) update({ enabled })
      else void persist({ ...serverSchedule, enabled })
    },
    syncNow,
    testConnection,
    connect,
    logout,
  }
}

export type SyncScheduleState = ReturnType<typeof useSyncSchedule>
