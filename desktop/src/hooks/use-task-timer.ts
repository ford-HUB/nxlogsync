import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nxlogsync.task-timer.startedAt'
const CLOCK_FROM_KEY = 'nxlogsync.task-timer.clockFrom'
const PAUSED_AT_KEY = 'nxlogsync.task-timer.pausedAt'
const PAUSED_MS_KEY = 'nxlogsync.task-timer.pausedMs'

function readNumber(key: string): number | null {
  try {
    const value = Number(localStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function writeNumber(key: string, value: number | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    // Storage blocked: the timer still works until the app closes.
  }
}

/**
 * A start/pause/stop stopwatch for the task being worked on. The task's start, the
 * moment Start was pressed, the pause in progress and the total paused time are kept
 * in localStorage so a running (or paused) timer survives reloads and app restarts.
 */
export function useTaskTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(() => readNumber(STORAGE_KEY))
  // The stopwatch counts from the press, even when the task starts earlier.
  const [clockFrom, setClockFrom] = useState<number | null>(() =>
    startedAt === null ? null : (readNumber(CLOCK_FROM_KEY) ?? startedAt),
  )
  const [pausedAt, setPausedAt] = useState<number | null>(() => (startedAt === null ? null : readNumber(PAUSED_AT_KEY)))
  const [pausedMs, setPausedMs] = useState<number>(() => (startedAt === null ? 0 : (readNumber(PAUSED_MS_KEY) ?? 0)))
  const [now, setNow] = useState(() => Date.now())

  const ticking = startedAt !== null && pausedAt === null
  useEffect(() => {
    if (!ticking) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [ticking])

  const setPause = (at: number | null, total: number) => {
    writeNumber(PAUSED_AT_KEY, at)
    writeNumber(PAUSED_MS_KEY, total || null)
    setPausedAt(at)
    setPausedMs(total)
  }

  /** Time on the stopwatch since Start was pressed, leaving out every pause. */
  const elapsedAt = (moment: number) => (clockFrom === null ? 0 : Math.max(0, moment - clockFrom - pausedMs))

  /**
   * Starts the stopwatch at 0:00:00 now. `at` (default now) is when the task began;
   * an earlier one still counts the time before the press toward the task on Stop.
   */
  const start = (at = Date.now()) => {
    const pressedAt = Date.now()
    writeNumber(STORAGE_KEY, at)
    writeNumber(CLOCK_FROM_KEY, pressedAt)
    setPause(null, 0)
    setStartedAt(at)
    setClockFrom(pressedAt)
    setNow(pressedAt)
  }

  const pause = () => {
    if (startedAt === null || pausedAt !== null) return
    setPause(Date.now(), pausedMs)
  }

  const resume = () => {
    if (pausedAt === null) return
    setPause(null, pausedMs + Math.max(0, Date.now() - pausedAt))
    setNow(Date.now())
  }

  /**
   * Ends the run; returns when the task started and when it would have stopped had
   * it never been paused (press + timed work), or null if it wasn't running.
   */
  const stop = (): { startedAt: Date; stoppedAt: Date } | null => {
    if (startedAt === null) return null
    const worked = elapsedAt(pausedAt ?? Date.now())
    const from = clockFrom ?? startedAt
    writeNumber(STORAGE_KEY, null)
    writeNumber(CLOCK_FROM_KEY, null)
    setPause(null, 0)
    setStartedAt(null)
    setClockFrom(null)
    return { startedAt: new Date(startedAt), stoppedAt: new Date(from + worked) }
  }

  return {
    running: startedAt !== null,
    paused: pausedAt !== null,
    startedAt: startedAt === null ? null : new Date(startedAt),
    elapsedMs: elapsedAt(pausedAt ?? now),
    start,
    pause,
    resume,
    stop,
  }
}
