import { create } from 'zustand'
import { getAimLabLeaderboard, submitAimLabScore } from '@/services/aim-lab-service'
import type { AimLabLeaderboard, AimLabScoreEvent, AimLabSetup } from '@/types/aim-lab'

interface AimLabLeaderboardState {
  /** Boards per mode, kept while the app runs. */
  boards: Partial<Record<AimLabSetup, AimLabLeaderboard>>
  /** The mode whose board is being fetched, if any. */
  loadingSetup: AimLabSetup | null
  error: string | null
  /** The last session sent, and whether the server kept it as a personal best. */
  lastSubmit: { setup: AimLabSetup; personalBest: boolean } | null
  fetchBoard: (setup: AimLabSetup) => Promise<void>
  /** Sends a finished session; the server keeps it only when it is a personal best. */
  submitScore: (setup: AimLabSetup, session: AimLabScoreEvent) => Promise<void>
  /** Forgets the signed-out user's boards. */
  reset: () => void
}

/** The Aim lab leaderboard, shaped like Tetris's; the player's name lives in the typing test's store. */
export const useAimLabLeaderboardStore = create<AimLabLeaderboardState>((set) => ({
  boards: {},
  loadingSetup: null,
  error: null,
  lastSubmit: null,

  fetchBoard: async (setup) => {
    set({ loadingSetup: setup, error: null })
    const result = await getAimLabLeaderboard(setup)
    if (result.success) {
      set((s) => ({
        boards: { ...s.boards, [setup]: result.data },
        loadingSetup: s.loadingSetup === setup ? null : s.loadingSetup,
      }))
    } else {
      set((s) => ({ error: result.message, loadingSetup: s.loadingSetup === setup ? null : s.loadingSetup }))
    }
  },

  submitScore: async (setup, session) => {
    const result = await submitAimLabScore({ ...session, setup })
    if (!result.success) {
      set({ error: result.message })
      return
    }
    const { entries, you, personalBest } = result.data
    set((s) => ({
      boards: { ...s.boards, [setup]: { setup, entries, you } },
      lastSubmit: { setup, personalBest },
      error: null,
    }))
  },

  reset: () => set({ boards: {}, loadingSetup: null, error: null, lastSubmit: null }),
}))
