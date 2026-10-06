import { create } from 'zustand'
import { createEntry, deleteEntry, listEntries, resyncDays, updateEntry } from '@/services/log-entries-service'
import type { EntryDraft, LogEntry } from '@/types/daily-log'

type EntriesByDate = Record<string, LogEntry[]>

interface DailyLogState {
  entriesByDate: EntriesByDate
  loading: boolean
  initialized: boolean
  /** Last failed load or save, shown until dismissed or the next action succeeds. */
  error: string | null
  fetchEntries: (from: string, to: string) => Promise<void>
  addEntry: (date: string, draft: EntryDraft) => Promise<void>
  updateEntry: (date: string, id: string, draft: EntryDraft) => Promise<void>
  removeEntry: (date: string, id: string) => Promise<void>
  /** Marks every entry on the days unsynced so the next sync uploads them again; resolves to the failure message, if any. */
  resyncDays: (dates: string[]) => Promise<string | null>
  dismissError: () => void
  /** Forgets the signed-out user's entries so the next user never sees them. */
  reset: () => void
}

const mapDay = (state: DailyLogState, date: string, fn: (entries: LogEntry[]) => LogEntry[]) => ({
  entriesByDate: { ...state.entriesByDate, [date]: fn(state.entriesByDate[date] ?? []) },
})

/**
 * Saves are optimistic so the form and heatmap react at once; a rejected save is
 * rolled back and its message kept in `error`.
 */
export const useDailyLogStore = create<DailyLogState>((set) => ({
  entriesByDate: {},
  loading: false,
  initialized: false,
  error: null,

  fetchEntries: async (from, to) => {
    set({ loading: true, error: null })
    const result = await listEntries(from, to)
    if (result.success) set({ entriesByDate: result.data, loading: false, initialized: true })
    else set({ error: result.message, loading: false, initialized: true })
  },

  addEntry: async (date, draft) => {
    const tempId = `pending-${crypto.randomUUID()}`
    set((s) => ({ ...mapDay(s, date, (day) => [...day, { id: tempId, ...draft, synced: false }]), error: null }))
    const result = await createEntry(date, draft)
    if (result.success) set((s) => mapDay(s, date, (day) => day.map((e) => (e.id === tempId ? result.data : e))))
    else set((s) => ({ ...mapDay(s, date, (day) => day.filter((e) => e.id !== tempId)), error: result.message }))
  },

  updateEntry: async (date, id, draft) => {
    let previous: LogEntry | undefined
    set((s) => ({
      ...mapDay(s, date, (day) =>
        day.map((e) => {
          if (e.id !== id) return e
          previous = e
          // The server marks an edited entry for upload again.
          return { ...e, ...draft, synced: false }
        }),
      ),
      error: null,
    }))
    const result = await updateEntry(id, draft)
    if (result.success) return
    set((s) => ({
      ...mapDay(s, date, (day) => day.map((e) => (e.id === id && previous ? previous : e))),
      error: result.message,
    }))
  },

  removeEntry: async (date, id) => {
    let removed: LogEntry | undefined
    let before: LogEntry[] = []
    set((s) => ({
      ...mapDay(s, date, (day) => {
        before = day
        removed = day.find((e) => e.id === id)
        // Deleting a synced entry sends the rest of the day to N-PAX again.
        const rest = day.filter((e) => e.id !== id)
        return removed?.synced ? rest.map((e) => ({ ...e, synced: false })) : rest
      }),
      error: null,
    }))
    const result = await deleteEntry(id)
    if (result.success || !removed) return
    set((s) => ({ ...mapDay(s, date, () => before), error: result.message }))
  },

  resyncDays: async (dates) => {
    const result = await resyncDays(dates)
    if (!result.success) return result.message
    set((s) => ({
      entriesByDate: {
        ...s.entriesByDate,
        ...Object.fromEntries(
          result.data.dates.map((date) => [date, (s.entriesByDate[date] ?? []).map((e) => ({ ...e, synced: false }))]),
        ),
      },
    }))
    return null
  },

  dismissError: () => set({ error: null }),

  reset: () => set({ entriesByDate: {}, loading: false, initialized: false, error: null }),
}))
