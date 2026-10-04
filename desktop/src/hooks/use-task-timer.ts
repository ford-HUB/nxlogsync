import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nxlogsync.task-timer.startedAt'

function readStartedAt(): number | null {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function writeStartedAt(value: number | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Storage blocked: the timer still works until the app closes.
  }
}

/**
 * A start/stop stopwatch for the task being worked on. The start time is kept in
 * localStorage so a running timer survives reloads and app restarts.
 */
export function useTaskTimer() {
  const [startedAt, setStartedAt] = useState<number | null>(readStartedAt)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const start = () => {
    const at = Date.now()
    writeStartedAt(at)
    setStartedAt(at)
  }

  /** Ends the run; returns when it started and stopped, or null if it wasn't running. */
  const stop = (): { startedAt: Date; stoppedAt: Date } | null => {
    if (startedAt === null) return null
    writeStartedAt(null)
    setStartedAt(null)
    return { startedAt: new Date(startedAt), stoppedAt: new Date() }
  }

  return {
    running: startedAt !== null,
    startedAt: startedAt === null ? null : new Date(startedAt),
    elapsedMs: startedAt === null ? 0 : Math.max(0, now - startedAt),
    start,
    stop,
  }
}
