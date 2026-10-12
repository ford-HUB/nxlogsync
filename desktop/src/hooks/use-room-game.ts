import { useCallback, useEffect, useRef, useState } from 'react'
import { ROOM_LEVELS } from '@/constants/run-rooms'
import { createRoomRun, holdMove, roomEscaped, stepRoom } from '@/lib/run-room-engine'
import { usePassOrFallStore } from '@/store/pass-or-fall-store'
import { useRunYourselfStore } from '@/store/run-yourself-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import type { PassOrFallProgress, RoomMove, RoomResult, RoomState } from '@/types/run-rooms'

/** A long frame (the window was hidden) counts as this much. */
const MAX_STEP = 1 / 30

/**
 * One Pass or fall game: the rooms, ticked every animation frame once started, the held keys,
 * and the result once the last door is reached or the attempts run out (recorded as the local
 * best when it beats it). Signed in, each door unlocked is saved for Continue, and the finished
 * run goes to the server's leaderboard.
 */
export function useRoomGame() {
  const submitBest = useRunYourselfStore((s) => s.submitBest)
  const saveProgress = usePassOrFallStore((s) => s.saveProgress)
  const submitScore = usePassOrFallStore((s) => s.submitScore)
  const signedIn = useSiteSessionStore((s) => s.target.userId !== null)
  const [room, setRoom] = useState<RoomState>(createRoomRun)
  const [result, setResult] = useState<RoomResult | null>(null)

  const active = room.status !== 'idle' && room.status !== 'finished'
  useEffect(() => {
    if (!active) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(MAX_STEP, (now - last) / 1000)
      last = now
      setRoom((s) => stepRoom(s, dt))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  // A door just unlocked: the next room is where Continue now resumes. The last door has no next room.
  const savedLevelRef = useRef(-1)
  useEffect(() => {
    if (room.status !== 'cleared' || !signedIn || savedLevelRef.current === room.level) return
    savedLevelRef.current = room.level
    const next = room.level + 1
    if (next >= ROOM_LEVELS.length) return
    void saveProgress({ level: next, points: room.points, seconds: Math.round(room.elapsed * 10) / 10 })
  }, [room, signedIn, saveProgress])

  // Out of the last door, or out of attempts: the result, and the local best if beaten.
  const resultRef = useRef(result)
  resultRef.current = result
  useEffect(() => {
    if (room.status !== 'finished' || resultRef.current) return
    const seconds = Math.round(room.elapsed * 10) / 10
    const escaped = roomEscaped(room)
    const levels = escaped ? ROOM_LEVELS.length : room.level
    setResult({
      points: room.points,
      levels,
      escaped,
      deaths: room.deaths,
      seconds,
      personalBest: submitBest({ mode: 'pass-or-fall' }, { points: room.points, metres: 0, seconds, levels }),
    })
    if (signedIn) void submitScore(room.points, levels, seconds)
  }, [room, submitBest, signedIn, submitScore])

  /** Back to the start screen, where New game or Continue is picked. */
  const restart = useCallback(() => {
    setResult(null)
    savedLevelRef.current = -1
    setRoom(createRoomRun())
  }, [])

  /** Starts playing at once: a new game from room 1, or Continue from saved progress (with fresh attempts). */
  const start = useCallback((from: PassOrFallProgress | null) => {
    setResult(null)
    savedLevelRef.current = -1
    setRoom({ ...createRoomRun(from), status: 'playing' })
  }, [])

  /** A key down or up; any key starts an idle game. */
  const hold = useCallback((move: RoomMove | undefined, down: boolean) => {
    setRoom((s) => holdMove(s, move, down))
  }, [])

  return { room, result, restart, start, hold }
}
