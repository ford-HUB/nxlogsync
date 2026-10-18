import { io, type Socket } from 'socket.io-client'
import { API_ORIGIN, getSessionToken } from './api-client'
import type {
  DuelLeaderboard,
  DuelMatch,
  DuelProgress,
  DuelVote,
  InviteClosedReason,
  OnlinePlayer,
} from '@/types/typing-duel'

/** `match` as the server pushes it: the countdown is relative, since the clocks differ. */
export type MatchPush = Omit<DuelMatch, 'startsAt'> & { countdownMs: number }

export interface DuelAck {
  ok: boolean
  message?: string
  inviteId?: string
  /** Left on a sent invite. */
  expiresInMs?: number
}

interface ServerEvents {
  presence: (players: OnlinePlayer[]) => void
  invite: (push: { id: string; from: { userId: string; name: string }; expiresInMs: number }) => void
  'invite-closed': (push: { id: string; reason: InviteClosedReason }) => void
  /** Null once the user left the match. */
  match: (push: MatchPush | null) => void
  /** The 1v1 board after a race was decided; `you` only for the two who raced. */
  leaderboard: (push: Pick<DuelLeaderboard, 'entries'> & Partial<Pick<DuelLeaderboard, 'you'>>) => void
  /** The opponent's caret. */
  progress: (push: DuelProgress) => void
  unauthorized: (body: { message: string }) => void
}

interface ClientEvents {
  who: (ack: (players: OnlinePlayer[]) => void) => void
  invite: (body: { userId: string }, ack: (res: DuelAck) => void) => void
  'invite-cancel': (body: { inviteId: string }, ack: (res: DuelAck) => void) => void
  'invite-respond': (body: { inviteId: string; accept: boolean }, ack: (res: DuelAck) => void) => void
  vote: (body: DuelVote, ack: (res: DuelAck) => void) => void
  progress: (body: DuelProgress) => void
  finish: (body: DuelProgress & { accuracy: number }, ack: (res: DuelAck) => void) => void
  rematch: (ack: (res: DuelAck) => void) => void
  leave: (ack: (res: DuelAck) => void) => void
}

export type TypingDuelSocket = Socket<ServerEvents, ClientEvents>

/**
 * Opens the server's `/typing-duel` Socket.IO namespace with the session token: who is online,
 * invites, and the 1v1 itself. It reconnects by itself, and the server re-sends the list, any
 * pending invites and the match on each connect.
 */
export function connectTypingDuelSocket(): TypingDuelSocket {
  return io(`${API_ORIGIN}/typing-duel`, {
    auth: (cb) => cb({ token: getSessionToken() ?? '' }),
    transports: ['websocket'],
  })
}
