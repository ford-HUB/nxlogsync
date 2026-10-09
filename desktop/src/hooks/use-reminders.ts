import { useCallback, useEffect, useState } from 'react'
import { FALLBACK_REMINDER, REMINDER_NO_DAYS_MESSAGE } from '@/constants/reminders'
import { useRemindersStore } from '@/store/reminders-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import type { ReminderSchedule } from '@/types/reminders'
import type { Weekday } from '@/types/sync-schedule'

function toSchedule({ enabled, atMinutes, days, nudge }: ReminderSchedule): ReminderSchedule {
  return { enabled, atMinutes, days, nudge }
}

function sameSchedule(a: ReminderSchedule, b: ReminderSchedule): boolean {
  return (
    a.enabled === b.enabled &&
    a.atMinutes === b.atMinutes &&
    a.nudge === b.nudge &&
    a.days.length === b.days.length &&
    a.days.every((d) => b.days.includes(d))
  )
}

/** `open`: the reminder dialog is showing; settings load each time it opens. */
export function useReminders(open: boolean) {
  const settings = useRemindersStore((s) => s.settings)
  const saving = useRemindersStore((s) => s.saving)
  const fetchingEmail = useRemindersStore((s) => s.fetchingEmail)
  const testing = useRemindersStore((s) => s.testing)
  const testSentTo = useRemindersStore((s) => s.testSentTo)
  const error = useRemindersStore((s) => s.error)
  const fetch = useRemindersStore((s) => s.fetch)
  const persist = useRemindersStore((s) => s.save)
  const refreshEmail = useRemindersStore((s) => s.refreshEmail)
  const sendTest = useRemindersStore((s) => s.sendTest)
  const reset = useRemindersStore((s) => s.reset)
  const userId = useSiteSessionStore((s) => s.target.userId)

  const saved = toSchedule(settings ?? FALLBACK_REMINDER)
  const [draft, setDraft] = useState(saved)

  // Reset the draft whenever the server's copy changes (first load, or after a save).
  const [loaded, setLoaded] = useState(settings)
  if (settings !== loaded) {
    setLoaded(settings)
    if (settings) setDraft(toSchedule(settings))
  }

  useEffect(() => {
    if (userId === null) reset()
    else if (open) void fetch()
  }, [fetch, reset, open, userId])

  const update = useCallback((patch: Partial<ReminderSchedule>) => setDraft((d) => ({ ...d, ...patch })), [])
  const toggleDay = useCallback((day: Weekday) => {
    setDraft((d) => ({ ...d, days: d.days.includes(day) ? d.days.filter((x) => x !== day) : [...d.days, day] }))
  }, [])

  const issue = draft.enabled && draft.days.length === 0 ? REMINDER_NO_DAYS_MESSAGE : null
  const isDirty = !sameSchedule(saved, draft)

  return {
    loaded: settings !== null,
    draft,
    email: settings?.email ?? null,
    saving,
    fetchingEmail,
    testing,
    testSentTo,
    error,
    issue,
    isDirty,
    update,
    toggleDay,
    /** Resolves true once the server has the draft. */
    save: () => persist(draft),
    discard: () => setDraft(saved),
    refreshEmail: () => void refreshEmail(),
    sendTest: () => void sendTest(),
  }
}

export type RemindersState = ReturnType<typeof useReminders>
