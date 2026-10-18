import { create } from 'zustand'
import { DUEL_INVITE_RESULT_SHOWN_MS } from '@/constants/typing-duel'
import { closeNotification, notifyIfAway } from '@/services/desktop-notifications'
import { getDuelLeaderboard } from '@/services/typing-service'
import { connectTypingDuelSocket, type DuelAck, type TypingDuelSocket } from '@/services/typing-duel-socket'
import type { LiveStatus } from '@/store/typing-leaderboard-store'
import type {
  DuelInvite,
  DuelLeaderboard,
  DuelMatch,
  DuelProgress,
  DuelVote,
  OnlinePlayer,
  OutgoingInvite,
} from '@/types/typing-duel'

const NOT_CONNECTED: DuelAck = { ok: false, message: 'Not connected to the server.' }
const NO_ANSWER: DuelAck = { ok: false, message: 'The server didn’t answer. Try again.' }
const ACK_TIMEOUT_MS = 5000

/** The one `/typing-duel` link, opened by connect() while the app is unlocked and signed in. */
let socket: TypingDuelSocket | null = null

/** Emits with an ack, resolving to a failure when offline instead of waiting forever. */
function request(send: (s: TypingDuelSocket, ack: (res: DuelAck) => void) => void): Promise<DuelAck> {
  const s = socket
  if (!s?.connected) return Promise.resolve(NOT_CONNECTED)
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(NO_ANSWER), ACK_TIMEOUT_MS)
    send(s, (res) => {
      window.clearTimeout(timer)
      resolve(res)
    })
  })
}

interface TypingDuelState {
  live: LiveStatus
  /** Everyone else online with a leaderboard name. */
  players: OnlinePlayer[]
  /** Challenges waiting for the user's answer, oldest first. */
  incoming: DuelInvite[]
  /** Challenges the user sent, per invited userId. */
  outgoing: Record<string, OutgoingInvite>
  /** The 1v1 the user is in, if any. */
  match: DuelMatch | null
  /** The opponent's caret while racing. */
  opponentProgress: DuelProgress | null
  /** The 1v1 leaderboard; null until fetched. */
  board: DuelLeaderboard | null
  boardLoading: boolean
  boardError: string | null
  fetchBoard: () => Promise<void>
  connect: () => void
  disconnect: () => void
  /** Asks the server for the list again (and lets it re-read the user's name). */
  refreshPlayers: () => void
  invite: (userId: string) => Promise<void>
  cancelInvite: (userId: string) => void
  /** Resolves to the failure message, if any. */
  respond: (inviteId: string, accept: boolean) => Promise<string | null>
  /** Votes on the race, the time, or both. */
  vote: (vote: DuelVote) => void
  sendProgress: (progress: DuelProgress) => void
  finish: (progress: DuelProgress, accuracy: number) => void
  rematch: () => void
  /** Leaves the 1v1 (a forfeit mid-race); a closed one is just cleared. */
  leave: () => void
}

export const useTypingDuelStore = create<TypingDuelState>((set, get) => ({
  live: 'offline',
  players: [],
  incoming: [],
  outgoing: {},
  match: null,
  opponentProgress: null,
  board: null,
  boardLoading: false,
  boardError: null,

  fetchBoard: async () => {
    set({ boardLoading: true, boardError: null })
    const result = await getDuelLeaderboard()
    if (result.success) set({ board: result.data, boardLoading: false })
    else set({ boardError: result.message, boardLoading: false })
  },

  connect: () => {
    if (socket) return
    const s = connectTypingDuelSocket()
    socket = s
    set({ live: 'connecting' })

    s.on('connect', () => {
      set({ live: 'live' })
      // Races decided while offline were missed.
      if (get().board) void get().fetchBoard()
    })
    s.on('leaderboard', (push) =>
      set((st) => {
        // The two who raced get their own record too; for everyone else it only moves if they're on the board.
        const index = push.entries.findIndex((e) => e.you)
        const mine = index >= 0 ? push.entries[index] : null
        const you =
          push.you !== undefined
            ? push.you
            : mine
              ? { rank: index + 1, points: mine.points, wins: mine.wins, losses: mine.losses, draws: mine.draws }
              : (st.board?.you ?? null)
        return { board: { entries: push.entries, you } }
      }),
    )
    s.on('disconnect', () =>
      // Invites and the list are re-sent on reconnect; a match the server lost is gone.
      set({ live: 'offline', players: [], incoming: [], outgoing: {} }),
    )
    s.on('connect_error', () => set({ live: 'offline' }))
    s.on('presence', (players) => set({ players }))
    s.on('invite', (push) => {
      set((st) => ({
        incoming: [
          ...st.incoming.filter((i) => i.id !== push.id),
          { id: push.id, from: push.from, expiresAt: Date.now() + push.expiresInMs },
        ],
      }))
      // Minimised or in the tray: a notification card; clicking it opens the app on the invite.
      notifyIfAway(
        push.id,
        'Typing 1v1 invite',
        `${push.from.name} challenges you to a typing race. Open NXLogSync to accept within ${Math.round(push.expiresInMs / 1000)}s.`,
      )
    })
    s.on('invite-closed', ({ id, reason }) => {
      closeNotification(id)
      set((st) => {
        const outgoing = { ...st.outgoing }
        for (const [userId, invite] of Object.entries(outgoing)) {
          if (invite.inviteId !== id) continue
          if (reason === 'declined' || reason === 'expired') {
            outgoing[userId] = { ...invite, status: reason }
            window.setTimeout(() => {
              const { outgoing: now } = get()
              if (now[userId]?.inviteId !== id) return
              const next = { ...now }
              delete next[userId]
              set({ outgoing: next })
            }, DUEL_INVITE_RESULT_SHOWN_MS)
          } else {
            delete outgoing[userId]
          }
        }
        return { outgoing, incoming: st.incoming.filter((i) => i.id !== id) }
      })
    })
    s.on('match', (push) => {
      if (!push) {
        set({ match: null, opponentProgress: null })
        return
      }
      const { countdownMs, ...rest } = push
      set((st) => ({
        match: { ...rest, startsAt: Date.now() + countdownMs },
        // A new race starts the opponent back at the first letter.
        opponentProgress: push.phase === 'racing' || push.phase === 'finished' ? st.opponentProgress : null,
      }))
    })
    s.on('progress', (opponentProgress) => set({ opponentProgress }))
  },

  disconnect: () => {
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    set({ live: 'offline', players: [], incoming: [], outgoing: {}, match: null, opponentProgress: null, board: null })
  },

  refreshPlayers: () => {
    if (socket?.connected) socket.emit('who', (players) => set({ players }))
  },

  invite: async (userId) => {
    set((st) => ({ outgoing: { ...st.outgoing, [userId]: { inviteId: null, status: 'sending' } } }))
    const res = await request((s, ack) => s.emit('invite', { userId }, ack))
    set((st) => ({
      outgoing: {
        ...st.outgoing,
        [userId]: res.ok
          ? { inviteId: res.inviteId ?? null, status: 'pending', expiresAt: Date.now() + (res.expiresInMs ?? 0) }
          : { inviteId: null, status: 'failed', message: res.message ?? 'Couldn’t send the invite.' },
      },
    }))
  },

  cancelInvite: (userId) => {
    const inviteId = get().outgoing[userId]?.inviteId
    if (inviteId) void request((s, ack) => s.emit('invite-cancel', { inviteId }, ack))
    const outgoing = { ...get().outgoing }
    delete outgoing[userId]
    set({ outgoing })
  },

  respond: async (inviteId, accept) => {
    closeNotification(inviteId)
    set((st) => ({ incoming: st.incoming.filter((i) => i.id !== inviteId) }))
    const res = await request((s, ack) => s.emit('invite-respond', { inviteId, accept }, ack))
    return res.ok ? null : (res.message ?? 'That invite is no longer open.')
  },

  vote: (vote) => {
    // Shown at once; the server's match push confirms it.
    set((st) => {
      if (!st.match) return {}
      const you = { ...st.match.you }
      if (vote.option) you.vote = vote.option
      if (vote.duration) you.durationVote = vote.duration
      return { match: { ...st.match, you } }
    })
    void request((s, ack) => s.emit('vote', vote, ack))
  },

  sendProgress: (progress) => {
    if (socket?.connected) socket.emit('progress', progress)
  },

  finish: (progress, accuracy) => {
    void request((s, ack) => s.emit('finish', { ...progress, accuracy }, ack))
  },

  rematch: () => {
    set((st) => (st.match ? { match: { ...st.match, you: { ...st.match.you, rematch: true } } } : {}))
    void request((s, ack) => s.emit('rematch', ack))
  },

  leave: () => {
    if (get().match?.phase !== 'closed') void request((s, ack) => s.emit('leave', ack))
    set({ match: null, opponentProgress: null })
  },
}))
