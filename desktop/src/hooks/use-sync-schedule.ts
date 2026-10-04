import { useCallback, useEffect, useState } from 'react'
import {
  ACTIVE_RUN_POLL_MS,
  CREDENTIALS_INVALID_MESSAGE,
  FALLBACK_SCHEDULE,
  RUNS_POLL_MS,
  SESSION_POLL_MS,
  TARGET_SITE_NAME,
  UPCOMING_LOOKAHEAD_DAYS,
  UPCOMING_LOOKAHEAD_MONTHS,
  UPCOMING_PREVIEW_COUNT,
} from '@/constants/sync-schedule'
import { useNow } from '@/hooks/use-now'
import { checkSession, connectSession, disconnectSession, getSessionStatus } from '@/services/credentials-service'
import { useSyncScheduleStore } from '@/store/sync-schedule-store'
import type {
  CredentialsCheck,
  ScheduleIssue,
  ScheduleState,
  SiteSession,
  SyncSchedule,
  SyncTarget,
  Weekday,
} from '@/types/sync-schedule'

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

/** Applies the server's session to the target card; the server owns login state. */
function applySession(target: SyncTarget, session: SiteSession): SyncTarget {
  return {
    ...target,
    userId: session.userId,
    connection: session.state,
    checkedAt: session.checkedAt ? new Date(session.checkedAt) : target.checkedAt,
  }
}

const sameSchedule = (a: SyncSchedule, b: SyncSchedule) => JSON.stringify(a) === JSON.stringify(b)

/**
 * State for the sync schedule screen. The schedule, run history and pending
 * minutes live on the server, which also fires scheduled runs and does the
 * uploads; edits stay in a local draft until saved. The server also holds the
 * N-PAX session, keeps it alive, and re-logs in when it expires; this screen
 * polls its status.
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

  const saved = serverSchedule ?? FALLBACK_SCHEDULE
  const [draft, setDraft] = useState(saved)
  const [target, setTarget] = useState<SyncTarget>(() => ({
    name: TARGET_SITE_NAME,
    userId: null,
    connection: 'checking',
    checkedAt: now,
  }))

  // Reset the draft whenever the server's copy changes (first load, or after a save).
  const [loadedSchedule, setLoadedSchedule] = useState(serverSchedule)
  if (serverSchedule !== loadedSchedule) {
    setLoadedSchedule(serverSchedule)
    if (serverSchedule) setDraft(serverSchedule)
  }

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const update = useCallback((patch: Partial<SyncSchedule>) => setDraft((d) => ({ ...d, ...patch })), [])

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
    if (!initialized) return
    const id = window.setInterval(() => void refreshActivity(), isSyncing ? ACTIVE_RUN_POLL_MS : RUNS_POLL_MS)
    return () => window.clearInterval(id)
  }, [initialized, isSyncing, refreshActivity])

  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      const result = await getSessionStatus()
      if (cancelled) return
      if (result.success) setTarget((t) => applySession(t, result.data))
      // Server down: a held session can't be confirmed, but a logged-out one stays logged out.
      else setTarget((t) => (t.userId === null ? t : { ...t, connection: 'unreachable' }))
    }
    void poll()
    const id = window.setInterval(() => void poll(), SESSION_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const testConnection = async () => {
    setTarget((t) => ({ ...t, connection: 'checking' }))
    const result = await checkSession()
    if (result.success) setTarget((t) => applySession(t, result.data))
    else setTarget((t) => ({ ...t, connection: 'unreachable' }))
  }

  // The server logs in to the site (Puppeteer) and keeps that session alive. The password
  // lives only in the server's memory; secure storage on this side comes later (main process).
  const connect = async (userId: string, password: string): Promise<CredentialsCheck> => {
    const result = await connectSession(userId, password)
    if (!result.success) return { status: 'error', message: result.message }
    if (!result.data.valid) return { status: 'invalid', message: CREDENTIALS_INVALID_MESSAGE }
    setTarget((t) => applySession(t, result.data.session))
    return { status: 'valid' }
  }

  /** Ends the server's session so the keep-alive stops logging in. Resolves to an error message, or null. */
  const logout = async (): Promise<string | null> => {
    const result = await disconnectSession()
    if (!result.success) return result.message
    setTarget((t) => applySession(t, result.data))
    return null
  }

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
    state: getScheduleState(saved),
    nextRun: getUpcomingRuns(saved, now, 1)[0] ?? null,
    previewRuns: getUpcomingRuns(draft, now, UPCOMING_PREVIEW_COUNT),
    successCount: finishedRuns.filter((r) => r.status === 'success').length,
    finishedCount: finishedRuns.length,
    update,
    toggleDay,
    save: () => {
      if (issue === null && !saving) void persist(draft)
    },
    discard: () => setDraft(saved),
    // The header switch takes effect immediately, like a pause button, not via Save.
    // Other unsaved edits survive: the reset after the save only follows the server's copy.
    setEnabled: async (enabled: boolean) => {
      if (!serverSchedule) return
      const pendingEdits = draft
      if (await persist({ ...serverSchedule, enabled })) setDraft({ ...pendingEdits, enabled })
    },
    syncNow,
    testConnection,
    connect,
    logout,
  }
}

export type SyncScheduleState = ReturnType<typeof useSyncSchedule>
