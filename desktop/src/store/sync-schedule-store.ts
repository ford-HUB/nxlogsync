import { create } from 'zustand'
import { getPending, getSchedule, listRuns, saveSchedule, startRun } from '@/services/sync-service'
import type { PendingUpload, SyncRun, SyncSchedule } from '@/types/sync-schedule'

interface SyncScheduleState {
  /** The schedule the server runs on; null until the first load succeeds. */
  schedule: SyncSchedule | null
  runs: SyncRun[]
  pending: PendingUpload
  initialized: boolean
  saving: boolean
  error: string | null
  fetchAll: () => Promise<void>
  /** Re-reads runs and pending minutes (after a run, or to pick up scheduled runs). */
  refreshActivity: () => Promise<void>
  saveSchedule: (schedule: SyncSchedule) => Promise<boolean>
  startRun: () => Promise<void>
  dismissError: () => void
  /** Forgets the signed-out user's schedule and runs so the next user never sees them. */
  reset: () => void
}

export const useSyncScheduleStore = create<SyncScheduleState>((set) => ({
  schedule: null,
  runs: [],
  pending: { days: 0, minutes: 0 },
  initialized: false,
  saving: false,
  error: null,

  fetchAll: async () => {
    set({ error: null })
    const [schedule, runs, pending] = await Promise.all([getSchedule(), listRuns(), getPending()])
    const failed = [schedule, runs, pending].find((r) => !r.success)
    set((s) => ({
      schedule: schedule.success ? schedule.data : s.schedule,
      runs: runs.success ? runs.data : s.runs,
      pending: pending.success ? pending.data : s.pending,
      error: failed && !failed.success ? failed.message : null,
      initialized: true,
    }))
  },

  refreshActivity: async () => {
    const [runs, pending] = await Promise.all([listRuns(), getPending()])
    set((s) => ({
      runs: runs.success ? runs.data : s.runs,
      pending: pending.success ? pending.data : s.pending,
    }))
  },

  saveSchedule: async (schedule) => {
    set({ saving: true, error: null })
    const result = await saveSchedule(schedule)
    if (result.success) {
      set({ schedule: result.data, saving: false })
      return true
    }
    set({ saving: false, error: result.message })
    return false
  },

  startRun: async () => {
    set({ error: null })
    const result = await startRun()
    if (result.success) {
      set((s) => ({ runs: [result.data, ...s.runs] }))
      return
    }
    // The server may have started a run on its own (scheduled, or resumed after
    // N-PAX logged in again) since the last poll; show that one instead of an error.
    const runs = await listRuns()
    if (runs.success && runs.data[0]?.status === 'running') set({ runs: runs.data })
    else set({ error: result.message })
  },

  dismissError: () => set({ error: null }),

  reset: () =>
    set({ schedule: null, runs: [], pending: { days: 0, minutes: 0 }, initialized: false, saving: false, error: null }),
}))
