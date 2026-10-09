import { create } from 'zustand'
import type { InsertPlan } from '@/lib/insert-entry'
import { useDailyLogStore } from '@/store/daily-log-store'
import type { LogEntry } from '@/types/daily-log'

const STORAGE_KEY = 'nxlogsync-trash'
const CONFIRMED_KEY = 'nxlogsync-trash-confirmed'

/** A task dropped in the Trash: gone from its day (and the server) until restored. */
export interface SetAsideEntry {
  /** The signed-in site user it belongs to, so another user never sees it. */
  userId: string
  date: string
  entry: LogEntry
  setAsideAt: number
}

function readItems(): SetAsideEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(saved)) return saved as SetAsideEntry[]
  } catch {
    // Storage unavailable or corrupt; start empty.
  }
  return []
}

function writeItems(items: SetAsideEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Not persisted; the Trash still holds them for this session.
  }
}

/** Per user, the calendar day ("YYYY-MM-DD") they last confirmed a drag into the Trash. */
type ConfirmedOn = Record<string, string>

function readConfirmed(): ConfirmedOn {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIRMED_KEY) ?? '{}')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) return saved as ConfirmedOn
  } catch {
    // Storage unavailable or corrupt; ask again.
  }
  return {}
}

interface TrashState {
  items: SetAsideEntry[]
  confirmedOn: ConfirmedOn
  /** Remembers the user confirmed setting a task aside today, so later drags that day skip the question. */
  markConfirmed: (userId: string, dayKey: string) => void
  /** Takes the entry off its day and keeps a copy here. */
  setAside: (userId: string, date: string, entry: LogEntry) => Promise<void>
  /** Logs the entry on its day again and takes it out of the Trash. */
  restore: (item: SetAsideEntry) => Promise<void>
  /** Logs the entry on any day at the planned spot (moving the entries below) and takes it out of the Trash. */
  placeInDay: (item: SetAsideEntry, date: string, plan: InsertPlan) => Promise<void>
  /** Throws away one set-aside entry for good. */
  discard: (item: SetAsideEntry) => void
  /** Throws away every set-aside entry of the user. */
  empty: (userId: string) => void
}

const update = (items: SetAsideEntry[]) => {
  writeItems(items)
  return { items }
}

export const useTrashStore = create<TrashState>((set) => ({
  items: readItems(),
  confirmedOn: readConfirmed(),

  markConfirmed: (userId, dayKey) =>
    set((s) => {
      const confirmedOn = { ...s.confirmedOn, [userId]: dayKey }
      try {
        localStorage.setItem(CONFIRMED_KEY, JSON.stringify(confirmedOn))
      } catch {
        // Not persisted; remembered for this session only.
      }
      return { confirmedOn }
    }),

  setAside: async (userId, date, entry) => {
    const item: SetAsideEntry = { userId, date, entry, setAsideAt: Date.now() }
    set((s) => update([item, ...s.items]))
    const log = useDailyLogStore.getState()
    await log.removeEntry(date, entry.id)
    // A failed delete is rolled back onto the day, so the copy here would be a duplicate.
    const stillLogged = useDailyLogStore.getState().entriesByDate[date]?.some((e) => e.id === entry.id)
    if (stillLogged) set((s) => update(s.items.filter((i) => i !== item)))
  },

  restore: async (item) => {
    set((s) => update(s.items.filter((i) => i !== item)))
    const { startMinutes, endMinutes, description, jobCode, workActivityCode } = item.entry
    const countOnDay = () => useDailyLogStore.getState().entriesByDate[item.date]?.length ?? 0
    const before = countOnDay()
    await useDailyLogStore.getState().addEntry(item.date, { startMinutes, endMinutes, description, jobCode, workActivityCode })
    // A rejected save is rolled back off the day; keep the entry in the Trash instead of losing it.
    if (countOnDay() <= before) set((s) => update([item, ...s.items]))
  },

  placeInDay: async (item, date, plan) => {
    set((s) => update(s.items.filter((i) => i !== item)))
    const { description, jobCode, workActivityCode } = item.entry
    const { startMinutes, endMinutes, moves } = plan
    const saved = await useDailyLogStore
      .getState()
      .insertEntry(date, { startMinutes, endMinutes, description, jobCode, workActivityCode }, moves)
    // Keep the entry in the Trash rather than losing it when the save is rejected.
    if (!saved) set((s) => update([item, ...s.items]))
  },

  discard: (item) => set((s) => update(s.items.filter((i) => i !== item))),

  empty: (userId) => set((s) => update(s.items.filter((i) => i.userId !== userId))),
}))
