import { create } from 'zustand'
import {
  getPassOrFallLeaderboard,
  getPassOrFallProgress,
  savePassOrFallProgress,
  submitPassOrFallScore,
} from '@/services/pass-or-fall-service'
import type { PassOrFallLeaderboard, PassOrFallProgress } from '@/types/run-rooms'

interface PassOrFallState {
  /** Where Continue resumes, from the server; null with nothing to continue. */
  progress: PassOrFallProgress | null
  board: PassOrFallLeaderboard | null
  loading: boolean
  error: string | null
  /** Progress and the board, together, for the signed-in user. */
  fetchAll: () => Promise<void>
  /** A door just unlocked; shown at once, then replaced by what the server kept. */
  saveProgress: (progress: PassOrFallProgress) => Promise<void>
  /** Sends a finished run; the server keeps it only when it is a personal best. */
  submitScore: (points: number, levels: number, seconds: number) => Promise<void>
  /** Forgets the signed-out user's progress and board. */
  reset: () => void
}

/** Pass or fall's account data: Continue's saved room, and the leaderboard of best runs. */
export const usePassOrFallStore = create<PassOrFallState>((set, get) => ({
  progress: null,
  board: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    const [progress, board] = await Promise.all([getPassOrFallProgress(), getPassOrFallLeaderboard()])
    set({
      loading: false,
      progress: progress.success ? progress.data.progress : get().progress,
      board: board.success ? board.data : get().board,
      error: !progress.success ? progress.message : !board.success ? board.message : null,
    })
  },

  saveProgress: async (progress) => {
    const known = get().progress
    // Only ever forward, the same rule as the server's, so the screen doesn't flicker back.
    if (!known || progress.level > known.level || (progress.level === known.level && progress.points > known.points)) {
      set({ progress })
    }
    const result = await savePassOrFallProgress(progress)
    if (result.success) set({ progress: result.data.progress, error: null })
    else set({ error: result.message })
  },

  submitScore: async (points, levels, seconds) => {
    const result = await submitPassOrFallScore(points, levels, seconds)
    if (!result.success) {
      set({ error: result.message })
      return
    }
    const { entries, you } = result.data
    set({ board: { entries, you }, error: null })
  },

  reset: () => set({ progress: null, board: null, loading: false, error: null }),
}))
