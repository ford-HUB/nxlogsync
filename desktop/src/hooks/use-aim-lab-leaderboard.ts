import { useEffect, useRef } from 'react'
import { useAimLabLeaderboardStore } from '@/store/aim-lab-leaderboard-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import type { AimLabSetup } from '@/types/aim-lab'

/**
 * The board for one round length, fetched when it changes. Needs a connected account (scores live on
 * it); signing out or switching user forgets the boards.
 */
export function useAimLabLeaderboard(setup: AimLabSetup) {
  const board = useAimLabLeaderboardStore((s) => s.boards[setup])
  const loading = useAimLabLeaderboardStore((s) => s.loadingSetup === setup)
  const error = useAimLabLeaderboardStore((s) => s.error)
  const fetchBoard = useAimLabLeaderboardStore((s) => s.fetchBoard)
  const reset = useAimLabLeaderboardStore((s) => s.reset)
  const userId = useSiteSessionStore((s) => s.target.userId)

  // Another user's boards would flag the wrong row as "you".
  const userRef = useRef(userId)
  useEffect(() => {
    if (userRef.current !== userId) reset()
    userRef.current = userId
  }, [userId, reset])

  useEffect(() => {
    if (userId !== null) void fetchBoard(setup)
  }, [fetchBoard, setup, userId])

  return { board, loading, error, signedOut: userId === null, retry: () => void fetchBoard(setup) }
}
