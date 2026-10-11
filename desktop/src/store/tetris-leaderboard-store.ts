import { create } from 'zustand'
import { getTetrisLeaderboard, submitTetrisScore } from '@/services/tetris-service'
import type { LiveStatus } from '@/store/typing-leaderboard-store'
import type { TetrisLeaderboard, TetrisLeaderboardEntry } from '@/types/tetris'

interface TetrisLeaderboardState {
  /** Boards per start level (tetrisBestKey), kept while the app runs. */
  boards: Record<string, TetrisLeaderboard>
  /** The start level whose board is being fetched, if any. */
  loadingSetup: string | null
  error: string | null
  live: LiveStatus
  setLive: (live: LiveStatus) => void
  /** A board pushed over the socket; keeps the user's off-board best when their row isn't in it. */
  applyPush: (setup: string, entries: TetrisLeaderboardEntry[]) => void
  fetchBoard: (setup: string) => Promise<void>
  /** Sends a finished game; the server keeps it only when it is a personal best. */
  submitScore: (setup: string, score: number, lines: number, level: number) => Promise<void>
  /** Forgets the signed-out user's boards. */
  reset: () => void
}

/** The Tetris leaderboard, shaped like the typing test's; the player's name lives in that store. */
export const useTetrisLeaderboardStore = create<TetrisLeaderboardState>((set) => ({
  boards: {},
  loadingSetup: null,
  error: null,
  live: 'offline',

  setLive: (live) => set({ live }),

  applyPush: (setup, entries) =>
    set((s) => {
      const index = entries.findIndex((e) => e.you)
      const you =
        index >= 0
          ? { rank: index + 1, score: entries[index].score, lines: entries[index].lines }
          : (s.boards[setup]?.you ?? null)
      return { boards: { ...s.boards, [setup]: { setup, entries, you } } }
    }),

  fetchBoard: async (setup) => {
    set({ loadingSetup: setup, error: null })
    const result = await getTetrisLeaderboard(setup)
    if (result.success) {
      set((s) => ({
        boards: { ...s.boards, [setup]: result.data },
        loadingSetup: s.loadingSetup === setup ? null : s.loadingSetup,
      }))
    } else {
      set((s) => ({ error: result.message, loadingSetup: s.loadingSetup === setup ? null : s.loadingSetup }))
    }
  },

  submitScore: async (setup, score, lines, level) => {
    const result = await submitTetrisScore(setup, score, lines, level)
    if (!result.success) {
      set({ error: result.message })
      return
    }
    const { entries, you } = result.data
    set((s) => ({ boards: { ...s.boards, [setup]: { setup, entries, you } }, error: null }))
  },

  reset: () => set({ boards: {}, loadingSetup: null, error: null }),
}))
