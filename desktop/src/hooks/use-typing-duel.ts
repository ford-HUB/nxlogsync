import { useEffect, useMemo, useRef, useState } from 'react'
import { DUEL_PROGRESS_INTERVAL_MS } from '@/constants/typing-duel'
import { useTypingTest, type FixedTest, type TypingSession } from '@/hooks/use-typing-test'
import { countCorrectWordChars } from '@/lib/typing-stats'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useTypingDuelStore } from '@/store/typing-duel-store'
import type { DuelMatch, DuelProgress } from '@/types/typing-duel'

/** The server's wpm ceiling for a report. */
const MAX_WPM = 350
/** How often the countdown number is checked. */
const COUNTDOWN_TICK_MS = 100

/**
 * Keeps the 1v1 link open while the app is unlocked and an account is connected, so the user is
 * listed online and can be invited from anywhere in the app. Signing out closes it.
 */
export function useTypingDuelConnection() {
  const userId = useSiteSessionStore((s) => s.target.userId)
  const connect = useTypingDuelStore((s) => s.connect)
  const disconnect = useTypingDuelStore((s) => s.disconnect)

  useEffect(() => {
    if (userId === null) return
    connect()
    return () => disconnect()
  }, [userId, connect, disconnect])
}

/** A racer's caret and correct characters, as sent to the opponent. */
export function progressOf(session: TypingSession, wpm: number): DuelProgress {
  return {
    word: session.typed.length,
    char: Math.min(session.input.length, 100),
    correct: countCorrectWordChars(session.words, session.typed, session.input),
    wpm: Math.min(MAX_WPM, wpm),
  }
}

/**
 * One 1v1 race on top of the typing test: the server's words, the clock started on GO, the
 * user's caret streamed to the opponent while racing, the result reported on finishing, and the
 * test stopped when the server ends the race first (the opponent finished, or time ran out).
 */
export function useDuelRace(match: DuelMatch) {
  const sendProgress = useTypingDuelStore((s) => s.sendProgress)
  const reportFinish = useTypingDuelStore((s) => s.finish)

  // A new deal (a new race, or a countdown restarted on a changed vote) is a new test.
  const { config, words } = match
  const wordsKey = words.join(' ')
  const fixed = useMemo<FixedTest | undefined>(
    () =>
      config && wordsKey
        ? { config: { mode: config.mode, amount: config.amount, punctuation: false, numbers: false }, words: wordsKey.split(' ') }
        : undefined,
    [config?.mode, config?.amount, wordsKey], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const test = useTypingTest(fixed)
  const { start, finish, session, liveWpm, result, elapsedMs } = test

  useEffect(() => {
    if (match.phase === 'racing') start()
    // The server ended the race, or the opponent left; freeze what was typed.
    if (match.phase === 'finished' || match.phase === 'closed') finish()
  }, [match.phase, fixed, start, finish])

  // A words race stops at the voted time too (a time race ends on its own clock).
  const limitMs = (config?.limit ?? 0) * 1000
  useEffect(() => {
    if (match.phase === 'racing' && config?.mode === 'words' && limitMs > 0 && elapsedMs >= limitMs) finish()
  }, [match.phase, config?.mode, limitMs, elapsedMs, finish])

  // The caret, a few times a second, only when it moved.
  const progressRef = useRef(progressOf(session, liveWpm))
  progressRef.current = progressOf(session, liveWpm)
  useEffect(() => {
    if (match.phase !== 'racing') return
    let last = ''
    const id = window.setInterval(() => {
      const p = progressRef.current
      const key = `${p.word}:${p.char}:${p.correct}:${p.wpm}`
      if (key === last) return
      last = key
      sendProgress(p)
    }, DUEL_PROGRESS_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [match.phase, sendProgress])

  // Each finished run is reported once; in a words race the first report to arrive wins.
  const reportedRef = useRef(result)
  useEffect(() => {
    if (!result || reportedRef.current === result) return
    reportedRef.current = result
    reportFinish({ ...progressOf(session, result.wpm), wpm: Math.min(MAX_WPM, result.wpm) }, result.accuracy)
  }, [result, session, reportFinish])

  return { test, progress: progressRef.current, countdown: useCountdown(match) }
}

/** Whole seconds until `expiresAt` (this machine's clock), ticking; 0 once past or without one. */
export function useSecondsLeft(expiresAt: number | undefined) {
  const [now, setNow] = useState(() => Date.now())
  const live = expiresAt !== undefined && expiresAt > now
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS)
    return () => window.clearInterval(id)
  }, [live])
  return expiresAt === undefined ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000))
}

/** Whole seconds left on the countdown (3, 2, 1), or 0 outside it. */
function useCountdown(match: DuelMatch) {
  const [now, setNow] = useState(() => Date.now())
  const counting = match.phase === 'countdown'
  useEffect(() => {
    if (!counting) return
    const id = window.setInterval(() => setNow(Date.now()), COUNTDOWN_TICK_MS)
    return () => window.clearInterval(id)
  }, [counting])
  return counting ? Math.max(1, Math.ceil((match.startsAt - now) / 1000)) : 0
}
