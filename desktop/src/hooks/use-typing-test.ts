import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_EXTRA_LETTERS, TIME_TEST_BUFFER } from '@/constants/typing-test'
import { consistency, countChars, countCorrectWordChars, toWpm } from '@/lib/typing-stats'
import { generateWords } from '@/lib/typing-words'
import { useTypingTestStore } from '@/store/typing-test-store'
import type { TypingConfig, TypingResult, TypingSecond, TypingStatus } from '@/types/typing-test'

export interface TypingSession {
  words: string[]
  /** What was typed for each finished word, in order. */
  typed: string[]
  /** The word being typed now (index typed.length). */
  input: string
  status: TypingStatus
}

/** Keystrokes within one second of the test. */
interface SecondTally {
  keys: number
  errors: number
}

/** The parts of a key event the test reads; a DOM or a React event both fit. */
type TypingKey = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'altKey' | 'metaKey' | 'getModifierState' | 'preventDefault'>

/** How often the clock is checked while a test runs. */
const TICK_MS = 100

const wordsFor = (config: TypingConfig) =>
  generateWords(config.mode === 'words' ? config.amount : TIME_TEST_BUFFER, config)

const freshSession = (words: string[]): TypingSession => ({ words, typed: [], input: '', status: 'idle' })

/**
 * A monkeytype-style typing test. Keys arrive through onKeyDown (wired to the window); the first
 * letter starts the clock. Space finishes a word (a wrong one can be reopened with Backspace),
 * Tab restarts. A time test ends on the clock, a words test on its last word.
 */
export function useTypingTest() {
  const config = useTypingTestStore((s) => s.config)
  const submitBest = useTypingTestStore((s) => s.submitBest)

  const [session, setSessionState] = useState(() => freshSession(wordsFor(config)))
  // Mirror of session, so keys pressed faster than React re-renders still see the latest state.
  const sessionRef = useRef(session)
  const setSession = useCallback((next: TypingSession) => {
    sessionRef.current = next
    setSessionState(next)
  }, [])

  const [elapsedMs, setElapsedMs] = useState(0)
  const [result, setResult] = useState<TypingResult | null>(null)
  const [capsLock, setCapsLock] = useState(false)
  /** Correct keystrokes out of all keystrokes so far, 0–100, for the live stats row. */
  const [liveAccuracy, setLiveAccuracy] = useState(100)
  const startedAtRef = useRef(0)
  const talliesRef = useRef<SecondTally[]>([])
  const totalsRef = useRef({ keys: 0, errors: 0 })

  const restart = useCallback(
    (repeat = false) => {
      startedAtRef.current = 0
      talliesRef.current = []
      totalsRef.current = { keys: 0, errors: 0 }
      setElapsedMs(0)
      setLiveAccuracy(100)
      setResult(null)
      setSession(freshSession(repeat ? sessionRef.current.words : wordsFor(config)))
    },
    [config, setSession],
  )

  // A new setup means a new test.
  useEffect(() => restart(), [restart])

  const finish = useCallback(() => {
    const s = sessionRef.current
    if (s.status !== 'running') return
    const ms = Math.max(Date.now() - startedAtRef.current, 1)
    setSession({ ...s, status: 'finished' })
    setElapsedMs(ms)

    // The unfinished word of a time test counts for what was typed of it, never as missed.
    const chars = countChars(s.words, s.typed)
    if (s.input) {
      const partial = countChars([s.words[s.typed.length].slice(0, s.input.length)], [s.input])
      chars.correct += partial.correct
      chars.incorrect += partial.incorrect
      chars.extra += partial.extra
    }
    const typedChars = s.typed.reduce((n, w) => n + w.length, 0) + s.typed.length + s.input.length
    const wpm = toWpm(countCorrectWordChars(s.words, s.typed, s.input), ms)

    // Per-second history; the cumulative count gives the wpm line, each second alone the raw line.
    const history: TypingSecond[] = []
    const fullSeconds = Math.ceil(ms / 1000)
    let keysSoFar = 0
    let errorsSoFar = 0
    for (let i = 0; i < fullSeconds; i++) {
      const tally = talliesRef.current[i] ?? { keys: 0, errors: 0 }
      keysSoFar += tally.keys
      errorsSoFar += tally.errors
      const secondMs = Math.min(1000, ms - i * 1000)
      // A sliver of a last second makes a meaningless spike; fold it away.
      if (secondMs < 500 && i > 0) break
      history.push({
        second: i + 1,
        wpm: toWpm(keysSoFar - errorsSoFar, Math.min((i + 1) * 1000, ms)),
        raw: toWpm(tally.keys, secondMs),
        errors: tally.errors,
      })
    }

    const { keys, errors } = totalsRef.current
    const rounded = Math.round(wpm * 100) / 100
    setResult({
      config,
      wpm: rounded,
      raw: toWpm(typedChars, ms),
      accuracy: keys > 0 ? ((keys - errors) / keys) * 100 : 0,
      consistency: consistency(history.map((h) => h.raw)),
      chars,
      seconds: ms / 1000,
      history,
      personalBest: submitBest(config, rounded),
    })
  }, [config, setSession, submitBest])

  // The clock: drives the countdown and ends a time test.
  useEffect(() => {
    if (session.status !== 'running') return
    const id = window.setInterval(() => {
      const ms = Date.now() - startedAtRef.current
      if (config.mode === 'time' && ms >= config.amount * 1000) {
        finish()
        return
      }
      setElapsedMs(ms)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [session.status, config, finish])

  const tally = (error: boolean) => {
    const index = Math.floor((Date.now() - startedAtRef.current) / 1000)
    const t = (talliesRef.current[index] ??= { keys: 0, errors: 0 })
    t.keys++
    totalsRef.current.keys++
    if (error) {
      t.errors++
      totalsRef.current.errors++
    }
    const { keys, errors } = totalsRef.current
    setLiveAccuracy(((keys - errors) / keys) * 100)
  }

  const onKeyDown = (e: TypingKey) => {
    setCapsLock(e.getModifierState('CapsLock'))
    if (e.key === 'Tab') {
      e.preventDefault()
      restart()
      return
    }
    const s = sessionRef.current
    if (s.status === 'finished' || e.altKey || e.metaKey) return
    const target = s.words[s.typed.length] ?? ''

    if (e.key === 'Backspace') {
      e.preventDefault()
      if (s.input) {
        setSession({ ...s, input: e.ctrlKey ? '' : s.input.slice(0, -1) })
        return
      }
      // Step back into the previous word only when it was typed wrong.
      const prevIndex = s.typed.length - 1
      if (prevIndex < 0 || s.typed[prevIndex] === s.words[prevIndex]) return
      const prev = s.typed[prevIndex]
      setSession({ ...s, typed: s.typed.slice(0, -1), input: e.ctrlKey ? '' : prev })
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      if (!s.input || s.status !== 'running') return
      tally(s.input !== target)
      const typed = [...s.typed, s.input]
      if (config.mode === 'words' && typed.length >= s.words.length) {
        sessionRef.current = { ...s, typed, input: '' }
        finish()
        return
      }
      // Keep a time test from running out of words.
      const words =
        config.mode === 'time' && s.words.length - typed.length < TIME_TEST_BUFFER / 2
          ? [...s.words, ...generateWords(TIME_TEST_BUFFER, config, s.words[s.words.length - 1])]
          : s.words
      setSession({ ...s, words, typed, input: '' })
      return
    }

    if (e.key.length !== 1 || e.ctrlKey) return
    e.preventDefault()
    if (s.input.length >= target.length + MAX_EXTRA_LETTERS) return
    let status = s.status
    if (status === 'idle') {
      status = 'running'
      startedAtRef.current = Date.now()
    }
    tally(e.key !== target[s.input.length])
    const input = s.input + e.key
    const next = { ...s, input, status }
    setSession(next)
    // A words test ends as soon as the last word is typed correctly, no space needed.
    if (config.mode === 'words' && s.typed.length === s.words.length - 1 && input === target) {
      sessionRef.current = { ...next, typed: [...s.typed, input], input: '' }
      finish()
    }
  }

  const correctChars = countCorrectWordChars(session.words, session.typed, session.input)
  const liveWpm = session.status === 'running' && elapsedMs > 1000 ? Math.round(toWpm(correctChars, elapsedMs)) : 0

  return { config, session, elapsedMs, liveWpm, liveAccuracy, result, capsLock, restart, onKeyDown }
}
