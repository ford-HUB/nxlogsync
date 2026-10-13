import { useCallback, useEffect, useRef, useState } from 'react'
import { activateSkill, createRun, pressAction, startRun, stepRun, toMetres } from '@/lib/run-engine'
import { useRunYourselfStore } from '@/store/run-yourself-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useSpeedRunStore } from '@/store/speed-run-store'
import type { RunAction, RunResult, RunState, SkillKind } from '@/types/run-yourself'

/** A long frame (the window was hidden) counts as this much, so nothing tunnels through. */
const MAX_STEP = 1 / 30

/**
 * One Run yourself game: the run state, ticked every animation frame while running, the moves,
 * and the result once it ends (recorded as the local best when it beats it). Signed in, a run
 * that crosses the line goes to the server's leaderboard.
 */
export function useRunGame() {
  const config = useRunYourselfStore((s) => s.config)
  const submitBest = useRunYourselfStore((s) => s.submitBest)
  const submitScore = useSpeedRunStore((s) => s.submitScore)
  const signedIn = useSiteSessionStore((s) => s.target.userId !== null)
  const [run, setRun] = useState<RunState>(() => createRun(config))
  const [result, setResult] = useState<RunResult | null>(null)
  const runRef = useRef(run)
  runRef.current = run

  // A new setup resets the game while it hasn't started.
  useEffect(() => {
    if (runRef.current.status === 'idle') setRun(createRun(config))
  }, [config])

  const active = run.status === 'countdown' || run.status === 'running' || run.status === 'falling'
  useEffect(() => {
    if (!active) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(MAX_STEP, (now - last) / 1000)
      last = now
      setRun((s) => stepRun(s, dt))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  // The run just ended: its result, and the local best if beaten.
  useEffect(() => {
    if (run.status !== 'finished' || result) return
    const points = Math.round(run.points)
    const metres = toMetres(run.distance)
    const seconds = Math.round(run.elapsed * 10) / 10
    setResult({
      config: run.config,
      points,
      metres,
      cleared: run.cleared,
      crashes: run.crashes,
      knockouts: run.knockouts,
      knockedOut: run.knockedOut,
      topSpeed: run.topSpeed,
      seconds: run.elapsed,
      // Knocked out short of the finish, there's no finish time to rank.
      personalBest: !run.knockedOut && submitBest(run.config, { points, metres, seconds }),
    })
    if (signedIn && !run.knockedOut && run.config.mode === 'speed-run') void submitScore(points, seconds)
  }, [run, result, submitBest, signedIn, submitScore])

  const restart = useCallback(() => {
    setResult(null)
    setRun(createRun(useRunYourselfStore.getState().config))
  }, [])

  /** Any key starts an idle game; after that, only the bound keys do anything. */
  const press = useCallback((action: RunAction | undefined) => {
    setRun((s) => {
      if (s.status === 'idle') return startRun(s)
      return action ? pressAction(s, action) : s
    })
  }, [])

  /** A skill's key or slot: spends a charge while running. */
  const activate = useCallback((skill: SkillKind) => setRun((s) => activateSkill(s, skill)), [])

  return { run, config, result, restart, press, activate }
}
