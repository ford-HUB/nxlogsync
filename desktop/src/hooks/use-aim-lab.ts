import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  AIM_LAB_DEFAULT_SECONDS,
  AIM_LAB_SCORE_EVENT,
  AIM_LAB_SECONDS_KEY,
  AIM_LAB_SENSITIVITY,
  AIM_LAB_SENSITIVITY_KEY,
  AIM_LAB_SENSITIVITY_SAVE_DELAY_MS,
  AIM_LAB_SETUPS,
  AIM_LAB_STATE_EVENT,
  AIM_LAB_UNITY_OBJECT,
} from '@/constants/aim-lab'
import { lockAimLabPointer, startAimLab } from '@/services/aim-lab-player'
import { getAimLabSettings, saveAimLabSettings } from '@/services/aim-lab-service'
import { useAimLabLeaderboardStore } from '@/store/aim-lab-leaderboard-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import type { AimLabGameState, AimLabScoreEvent, AimLabSetup, AimLabStatus, UnityInstance } from '@/types/aim-lab'

const initialState = (roundSeconds: number): AimLabGameState => ({
  phase: 'ready',
  roundSeconds,
  timeLeft: roundSeconds,
  score: 0,
  shotsFired: 0,
  accuracy: 0,
})

const clampSensitivity = (value: number) => Math.min(AIM_LAB_SENSITIVITY.max, Math.max(AIM_LAB_SENSITIVITY.min, value))
const isSetup = (setup: string): setup is AimLabSetup => AIM_LAB_SETUPS.some((s) => s.setup === setup)
const setupFor = (seconds: number) => AIM_LAB_SETUPS.find((s) => s.seconds === seconds)?.setup

function readNumber(key: string): number {
  try {
    return Number(localStorage.getItem(key))
  } catch {
    return 0
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Not kept in a private window; the default comes back next time.
  }
}

function readSensitivity(): number {
  const saved = readNumber(AIM_LAB_SENSITIVITY_KEY)
  return saved > 0 ? clampSensitivity(saved) : AIM_LAB_SENSITIVITY.default
}

function readSeconds(): number {
  const saved = readNumber(AIM_LAB_SECONDS_KEY)
  return setupFor(saved) ? saved : AIM_LAB_DEFAULT_SECONDS
}

/**
 * Runs the Unity gridshot game on the canvas while `enabled`, and quits it on unmount. The game only
 * draws the range; the page draws every screen from the state it publishes, and drives it with
 * start / quit / sensitivity. Each round length has its own board; every finished round is sent to
 * it when an account is connected, as is the sensitivity.
 */
export function useAimLab(canvasRef: RefObject<HTMLCanvasElement>, enabled: boolean) {
  const [status, setStatus] = useState<AimLabStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [seconds, setSecondsState] = useState(readSeconds)
  const [game, setGame] = useState<AimLabGameState>(() => initialState(seconds))
  const [lastRound, setLastRound] = useState<AimLabScoreEvent | null>(null)
  /** The best round per length since the app opened. */
  const [bestRounds, setBestRounds] = useState<Partial<Record<AimLabSetup, AimLabScoreEvent>>>({})
  const [sensitivity, setSensitivityState] = useState(readSensitivity)
  const submitScore = useAimLabLeaderboardStore((s) => s.submitScore)
  const submitError = useAimLabLeaderboardStore((s) => s.error)
  const userId = useSiteSessionStore((s) => s.target.userId)
  const connected = userId !== null

  const instanceRef = useRef<UnityInstance | null>(null)
  const sensitivityRef = useRef(sensitivity)
  sensitivityRef.current = sensitivity
  const secondsRef = useRef(seconds)
  secondsRef.current = seconds

  const setup = setupFor(seconds) ?? AIM_LAB_SETUPS[0].setup

  const send = useCallback((method: string, value?: number) => {
    instanceRef.current?.SendMessage(AIM_LAB_UNITY_OBJECT, method, value)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!enabled || !canvas) return
    let cancelled = false
    let quit: (() => Promise<void>) | null = null
    setStatus('loading')
    setProgress(0)
    setLoadError(null)
    setGame(initialState(secondsRef.current))

    // Start on the next tick: StrictMode mounts, unmounts and remounts at once in dev, and two
    // Unity instances starting on one canvas break each other.
    const timer = window.setTimeout(() => {
      startAimLab(canvas, (p) => {
        if (!cancelled) setProgress(p)
      })
        .then((instance) => {
          if (cancelled) return void instance.Quit()
          quit = () => instance.Quit()
          instanceRef.current = instance
          instance.SendMessage(AIM_LAB_UNITY_OBJECT, 'SetSensitivity', sensitivityRef.current)
          setStatus('ready')
        })
        .catch((err: unknown) => {
          console.error('Aim trainer failed to start', err)
          if (cancelled) return
          setLoadError(err instanceof Error ? err.message : String(err))
          setStatus('error')
        })
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      instanceRef.current = null
      void quit?.()
    }
  }, [canvasRef, enabled])

  useEffect(() => {
    const onState = (event: Event) => {
      const state = (event as CustomEvent<AimLabGameState>).detail
      if (state) setGame(state)
    }
    window.addEventListener(AIM_LAB_STATE_EVENT, onState)
    return () => window.removeEventListener(AIM_LAB_STATE_EVENT, onState)
  }, [])

  useEffect(() => {
    const onScore = (event: Event) => {
      const round = (event as CustomEvent<AimLabScoreEvent>).detail
      if (!round || !isSetup(round.setup)) return
      const setup = round.setup
      setLastRound(round)
      setBestRounds((best) => {
        const previous = best[setup]
        return !previous || round.score > previous.score ? { ...best, [setup]: round } : best
      })
      if (connected) void submitScore(setup, round)
    }
    window.addEventListener(AIM_LAB_SCORE_EVENT, onScore)
    return () => window.removeEventListener(AIM_LAB_SCORE_EVENT, onScore)
  }, [connected, submitScore])

  /** Starts a round of the selected length; mid-round (Tab) it restarts at once. */
  const start = useCallback(() => {
    setLastRound(null)
    send('StartRound', secondsRef.current)
  }, [send])

  const setSeconds = useCallback((value: number) => {
    if (!setupFor(value)) return
    setSecondsState(value)
    setGame((g) => (g.phase === 'ready' || g.phase === 'results' ? initialState(value) : g))
    writeNumber(AIM_LAB_SECONDS_KEY, value)
  }, [])

  const quit = useCallback(() => send('QuitRound'), [send])

  /** Back into a paused round: takes the mouse lock here, inside the click, then tells the game. */
  const resume = useCallback(() => {
    if (canvasRef.current) lockAimLabPointer(canvasRef.current)
    send('ResumeRound')
  }, [canvasRef, send])

  /** Shows the value and keeps it on this computer; the account copy is saved separately. */
  const applySensitivity = useCallback(
    (value: number) => {
      const next = clampSensitivity(value)
      setSensitivityState(next)
      send('SetSensitivity', next)
      writeNumber(AIM_LAB_SENSITIVITY_KEY, next)
      return next
    },
    [send],
  )

  // The account's sensitivity wins on sign-in; an account without one takes this computer's.
  const saveTimerRef = useRef<number | undefined>(undefined)
  const syncedUserRef = useRef<string | null>(null)
  useEffect(() => {
    syncedUserRef.current = null
    window.clearTimeout(saveTimerRef.current)
    if (userId === null) return
    let cancelled = false
    void getAimLabSettings().then((result) => {
      if (cancelled || !result.success) return
      syncedUserRef.current = userId
      if (result.data.sensitivity !== null) applySensitivity(result.data.sensitivity)
      else void saveAimLabSettings(sensitivityRef.current)
    })
    return () => {
      cancelled = true
    }
  }, [userId, applySensitivity])

  // A pending save still goes out when the page closes mid-drag.
  useEffect(
    () => () => {
      if (saveTimerRef.current === undefined) return
      window.clearTimeout(saveTimerRef.current)
      if (syncedUserRef.current !== null) void saveAimLabSettings(sensitivityRef.current)
    },
    [],
  )

  const setSensitivity = useCallback(
    (value: number) => {
      const next = applySensitivity(value)
      // Before the account's value has loaded, a save would overwrite it with this computer's.
      if (syncedUserRef.current === null) return
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = undefined
        void saveAimLabSettings(next)
      }, AIM_LAB_SENSITIVITY_SAVE_DELAY_MS)
    },
    [applySensitivity],
  )

  return {
    status,
    progress,
    loadError,
    game,
    lastRound,
    /** The best round since the app opened, for the selected length. */
    bestRound: bestRounds[setup] ?? null,
    seconds,
    /** The selected length's leaderboard key. */
    setup,
    setSeconds,
    sensitivity,
    setSensitivity,
    start,
    quit,
    resume,
    submitError,
  }
}
