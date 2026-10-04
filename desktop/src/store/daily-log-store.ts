import { create } from 'zustand'
import { createEntry, deleteEntry, listEntries, updateEntry } from '@/services/log-entries-service'
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
  dismissError: () => void
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
    set((s) => ({ ...mapDay(s, date, (day) => [...day, { id: tempId, ...draft }]), error: null }))
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
          return { ...e, ...draft }
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
    set((s) => ({
      ...mapDay(s, date, (day) => {
        removed = day.find((e) => e.id === id)
        return day.filter((e) => e.id !== id)
      }),
      error: null,
    }))
    const result = await deleteEntry(id)
    if (result.success || !removed) return
    const restored = removed
    set((s) => ({ ...mapDay(s, date, (day) => [...day, restored]), error: result.message }))
  },

  dismissError: () => set({ error: null }),
}))
