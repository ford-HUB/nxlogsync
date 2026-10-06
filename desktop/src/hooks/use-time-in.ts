import { useEffect, useState } from 'react'
import { shiftStartMinutes } from '@/constants/daily-log'
import { getTimeIn } from '@/services/attendance-service'

// A recorded time in never changes, so each day is read from N-PAX at most once per session.
const timeInCache = new Map<string, number>()

/** "08:47" or "8:47 AM" → 527; null when it can't be read. */
function parseTimeIn(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(value.trim())
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const meridiem = match[3]?.toUpperCase()
  if (meridiem) hours = (hours % 12) + (meridiem === 'PM' ? 12 : 0)
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * The day's shift start from the N-PAX workflow time in (rounded up to the next
 * 10-minute mark, as N-PAX does), in minutes of the day. Null
 * until it loads, when the day has none yet, or when it can't be fetched (the
 * form then falls back to its default start).
 */
export function useTimeIn(dateKey: string, enabled: boolean): number | null {
  const [loaded, setLoaded] = useState<{ dateKey: string; minutes: number | null } | null>(null)

  useEffect(() => {
    if (!enabled || timeInCache.has(dateKey)) return
    let cancelled = false
    void getTimeIn(dateKey).then((result) => {
      const timeIn = result.success && result.data.timeIn ? parseTimeIn(result.data.timeIn) : null
      const minutes = timeIn === null ? null : shiftStartMinutes(timeIn)
      if (minutes !== null) timeInCache.set(dateKey, minutes)
      if (!cancelled) setLoaded({ dateKey, minutes })
    })
    return () => {
      cancelled = true
    }
  }, [dateKey, enabled])

  if (!enabled) return null
  return timeInCache.get(dateKey) ?? (loaded?.dateKey === dateKey ? loaded.minutes : null)
}
