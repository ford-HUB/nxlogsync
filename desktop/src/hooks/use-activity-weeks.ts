import { useMemo } from 'react'
import { ACTIVITY_WEEKS } from '@/constants/daily-log'
import { fromDateKey, shiftDateKey } from '@/constants/time-format'

export interface ActivityWeek {
  /** Month abbreviation when a month starts in this week. */
  monthLabel: string | null
  /** Seven date keys, Monday → Sunday; null for days after today. */
  days: (string | null)[]
}

const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: 'short' })

/** Weeks oldest → newest, ending with the week that contains today. */
function buildWeeks(todayKey: string): ActivityWeek[] {
  const mondayOffset = (fromDateKey(todayKey).getDay() + 6) % 7
  const thisMonday = shiftDateKey(todayKey, -mondayOffset)

  return Array.from({ length: ACTIVITY_WEEKS }, (_, i) => {
    const monday = shiftDateKey(thisMonday, -7 * (ACTIVITY_WEEKS - 1 - i))
    const keys = Array.from({ length: 7 }, (_, day) => shiftDateKey(monday, day))
    const firstOfMonth = keys.find((key) => key <= todayKey && key.endsWith('-01'))
    return {
      monthLabel: firstOfMonth ? MONTH_FORMAT.format(fromDateKey(firstOfMonth)) : null,
      days: keys.map((key) => (key > todayKey ? null : key)),
    }
  })
}

/** Logged minutes and days with entries across the heatmap's range. */
export function useActivityTotals(todayKey: string, minutesByDate: Record<string, number>) {
  return useMemo(() => {
    let totalMinutes = 0
    let daysLogged = 0
    for (const week of buildWeeks(todayKey)) {
      for (const key of week.days) {
        const minutes = key ? (minutesByDate[key] ?? 0) : 0
        totalMinutes += minutes
        if (minutes > 0) daysLogged++
      }
    }
    return { totalMinutes, daysLogged }
  }, [todayKey, minutesByDate])
}

export function useActivityWeeks(todayKey: string): ActivityWeek[] {
  return useMemo(() => buildWeeks(todayKey), [todayKey])
}
