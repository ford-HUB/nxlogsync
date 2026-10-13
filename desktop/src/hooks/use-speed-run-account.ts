import { useEffect, useRef } from 'react'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useSpeedRunStore } from '@/store/speed-run-store'

/**
 * Speed run's leaderboard for the connected account, fetched when it signs in or changes.
 * Signed out, the board is empty.
 */
export function useSpeedRunAccount() {
  const board = useSpeedRunStore((s) => s.board)
  const loading = useSpeedRunStore((s) => s.loading)
  const error = useSpeedRunStore((s) => s.error)
  const fetchBoard = useSpeedRunStore((s) => s.fetchBoard)
  const reset = useSpeedRunStore((s) => s.reset)
  const userId = useSiteSessionStore((s) => s.target.userId)

  // Another user's board would mark the wrong row as theirs.
  const userRef = useRef(userId)
  useEffect(() => {
    if (userRef.current !== userId) reset()
    userRef.current = userId
  }, [userId, reset])

  useEffect(() => {
    if (userId !== null) void fetchBoard()
  }, [fetchBoard, userId])

  return { board, loading, error, signedIn: userId !== null, retry: () => void fetchBoard() }
}
