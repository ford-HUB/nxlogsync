import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nxlogsync.task-timer.startedAt'
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
 * A start/pause/stop stopwatch for the task being worked on. The start time, the
 * pause in progress and the total paused time are kept in localStorage so a
 * running (or paused) timer survives reloads and app restarts.
 */
export function useTaskTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(() => readNumber(STORAGE_KEY))
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

  /** Worked time so far, leaving out every pause. */
  const elapsedAt = (moment: number) => (startedAt === null ? 0 : Math.max(0, moment - startedAt - pausedMs))

  /** Starts timing from `at` (default now); an earlier start counts the time since as worked. */
  const start = (at = Date.now()) => {
    writeNumber(STORAGE_KEY, at)
    setPause(null, 0)
    setStartedAt(at)
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
   * Ends the run; returns when it started and when it would have stopped had it
   * never been paused (start + worked time), or null if it wasn't running.
   */
  const stop = (): { startedAt: Date; stoppedAt: Date } | null => {
    if (startedAt === null) return null
    const worked = elapsedAt(pausedAt ?? Date.now())
    writeNumber(STORAGE_KEY, null)
    setPause(null, 0)
    setStartedAt(null)
    return { startedAt: new Date(startedAt), stoppedAt: new Date(startedAt + worked) }
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
