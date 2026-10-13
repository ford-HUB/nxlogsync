import { create } from 'zustand'
import { getSpeedRunLeaderboard, submitSpeedRunScore } from '@/services/speed-run-service'
import type { SpeedRunLeaderboard } from '@/types/run-yourself'

interface SpeedRunState {
  board: SpeedRunLeaderboard | null
  loading: boolean
  error: string | null
  /** The board, for the signed-in user. */
  fetchBoard: () => Promise<void>
  /** Sends a run that crossed the line; the server keeps it only when it is a personal best. */
  submitScore: (points: number, seconds: number) => Promise<void>
  /** Forgets the signed-out user's board. */
  reset: () => void
}

/** Speed run's account data: the leaderboard of best runs to the finish line. */
export const useSpeedRunStore = create<SpeedRunState>((set, get) => ({
  board: null,
  loading: false,
  error: null,

  fetchBoard: async () => {
    set({ loading: true, error: null })
    const result = await getSpeedRunLeaderboard()
    set({
      loading: false,
      board: result.success ? result.data : get().board,
      error: result.success ? null : result.message,
    })
  },

  submitScore: async (points, seconds) => {
    const result = await submitSpeedRunScore(points, seconds)
    if (!result.success) {
      set({ error: result.message })
      return
    }
    const { entries, you } = result.data
    set({ board: { entries, you }, error: null })
  },

  reset: () => set({ board: null, loading: false, error: null }),
}))
