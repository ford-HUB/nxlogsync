import { create } from 'zustand'
import { getReminder, refreshReminderEmail, saveReminder, sendTestReminder } from '@/services/reminders-service'
import type { ReminderSchedule, ReminderSettings } from '@/types/reminders'

interface RemindersState {
  /** The server's copy; null until the first load succeeds. */
  settings: ReminderSettings | null
  saving: boolean
  fetchingEmail: boolean
  testing: boolean
  /** Address the last test went to. */
  testSentTo: string | null
  error: string | null
  /** Loads the settings; reads the email from N-PAX once if none is stored yet. */
  fetch: () => Promise<void>
  save: (schedule: ReminderSchedule) => Promise<boolean>
  refreshEmail: () => Promise<void>
  sendTest: () => Promise<void>
  /** Forgets the signed-out user's settings so the next user never sees them. */
  reset: () => void
}

const initialState = {
  settings: null,
  saving: false,
  fetchingEmail: false,
  testing: false,
  testSentTo: null,
  error: null,
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  ...initialState,

  fetch: async () => {
    set({ error: null })
    const result = await getReminder()
    if (!result.success) {
      set({ error: result.message })
      return
    }
    set({ settings: result.data })
    // Stored once read, so N-PAX is only visited the first time.
    if (result.data.emailFetchedAt === null) await get().refreshEmail()
  },

  save: async (schedule) => {
    set({ saving: true, error: null })
    const result = await saveReminder(schedule)
    if (result.success) {
      set({ settings: result.data, saving: false })
      return true
    }
    set({ saving: false, error: result.message })
    return false
  },

  refreshEmail: async () => {
    set({ fetchingEmail: true, error: null })
    const result = await refreshReminderEmail()
    if (result.success) set({ settings: result.data, fetchingEmail: false })
    else set({ fetchingEmail: false, error: result.message })
  },

  sendTest: async () => {
    set({ testing: true, testSentTo: null, error: null })
    const result = await sendTestReminder()
    if (result.success) {
      set((s) => ({
        testing: false,
        testSentTo: result.data.email,
        settings: s.settings && { ...s.settings, email: result.data.email },
      }))
    } else set({ testing: false, error: result.message })
  },

  reset: () => set(initialState),
}))
