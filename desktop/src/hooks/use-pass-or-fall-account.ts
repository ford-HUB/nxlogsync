import { useEffect, useRef } from 'react'
import { useSiteSessionStore } from '@/store/site-session-store'
import { usePassOrFallStore } from '@/store/pass-or-fall-store'

/**
 * Pass or fall's progress and leaderboard for the connected account, fetched when it signs in or
 * changes. Signed out, there is nothing to continue and the board is empty.
 */
export function usePassOrFallAccount() {
  const progress = usePassOrFallStore((s) => s.progress)
  const board = usePassOrFallStore((s) => s.board)
  const loading = usePassOrFallStore((s) => s.loading)
  const error = usePassOrFallStore((s) => s.error)
  const fetchAll = usePassOrFallStore((s) => s.fetchAll)
  const reset = usePassOrFallStore((s) => s.reset)
  const userId = useSiteSessionStore((s) => s.target.userId)

  // Another user's progress would continue the wrong game.
  const userRef = useRef(userId)
  useEffect(() => {
    if (userRef.current !== userId) reset()
    userRef.current = userId
  }, [userId, reset])

  useEffect(() => {
    if (userId !== null) void fetchAll()
  }, [fetchAll, userId])

  return { progress, board, loading, error, signedIn: userId !== null, retry: () => void fetchAll() }
}
