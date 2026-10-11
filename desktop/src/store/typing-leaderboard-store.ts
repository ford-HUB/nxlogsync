import { create } from 'zustand'
import { getLeaderboard, getTypingPlayer, saveTypingPlayer, submitTypingScore } from '@/services/typing-service'
import type { LeaderboardEntry, TypingLeaderboard } from '@/types/typing-test'

type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error'

/** The Socket.IO link that pushes other players' new bests. */
export type LiveStatus = 'connecting' | 'live' | 'offline'

interface TypingLeaderboardState {
  /** The signed-in user's leaderboard name; null until they pick one or while unknown. */
  playerName: string | null
  /** 'ready' once the server has said whether a name exists. */
  playerStatus: PlayerStatus
  /** The signed-in user the name was read for, so a different user reads theirs again. */
  playerFor: string | null
  /** Boards per test setup (bestKey), kept while the app runs. */
  boards: Record<string, TypingLeaderboard>
  /** The setup whose board is being fetched, if any. */
  loadingSetup: string | null
  error: string | null
  live: LiveStatus
  setLive: (live: LiveStatus) => void
  /** A board pushed over the socket; keeps the user's off-board best when their row isn't in it. */
  applyPush: (setup: string, entries: LeaderboardEntry[]) => void
  fetchPlayer: (userId: string) => Promise<void>
  /** Resolves to the failure message, if any. */
  savePlayer: (name: string) => Promise<string | null>
  fetchBoard: (setup: string) => Promise<void>
  /** Sends a finished run; the server keeps it only when it is a personal best. */
  submitScore: (setup: string, wpm: number, accuracy: number) => Promise<void>
  /** Forgets the signed-out user's name and boards. */
  reset: () => void
}

export const useTypingLeaderboardStore = create<TypingLeaderboardState>((set) => ({
  playerName: null,
  playerStatus: 'idle',
  playerFor: null,
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
          ? { rank: index + 1, wpm: entries[index].wpm, accuracy: entries[index].accuracy }
          : (s.boards[setup]?.you ?? null)
      return { boards: { ...s.boards, [setup]: { setup, entries, you } } }
    }),

  fetchPlayer: async (userId) => {
    set({ playerStatus: 'loading', playerFor: userId })
    const result = await getTypingPlayer()
    if (result.success) set({ playerName: result.data.name, playerStatus: 'ready' })
    else set({ playerStatus: 'error', error: result.message })
  },

  savePlayer: async (name) => {
    const result = await saveTypingPlayer(name)
    if (!result.success) return result.message
    set({ playerName: result.data.name, playerStatus: 'ready' })
    return null
  },

  fetchBoard: async (setup) => {
    set({ loadingSetup: setup, error: null })
    const result = await getLeaderboard(setup)
    if (result.success) {
      set((s) => ({
        boards: { ...s.boards, [setup]: result.data },
        loadingSetup: s.loadingSetup === setup ? null : s.loadingSetup,
      }))
    } else {
      set((s) => ({ error: result.message, loadingSetup: s.loadingSetup === setup ? null : s.loadingSetup }))
    }
  },

  submitScore: async (setup, wpm, accuracy) => {
    const result = await submitTypingScore(setup, wpm, accuracy)
    if (!result.success) {
      set({ error: result.message })
      return
    }
    const { entries, you } = result.data
    set((s) => ({ boards: { ...s.boards, [setup]: { setup, entries, you } }, error: null }))
  },

  reset: () =>
    set({ playerName: null, playerStatus: 'idle', playerFor: null, boards: {}, loadingSetup: null, error: null }),
}))
