import { io, type Socket } from 'socket.io-client'
import { API_ORIGIN, getSessionToken } from './api-client'
import type { LeaderboardEntry } from '@/types/typing-test'

/** What the server pushes on `leaderboard` when someone sets a new best on a watched setup. */
export interface LeaderboardPush {
  setup: string
  entries: LeaderboardEntry[]
}

interface ServerEvents {
  leaderboard: (push: LeaderboardPush) => void
  unauthorized: (body: { message: string }) => void
}

interface ClientEvents {
  subscribe: (body: { setup: string }, ack: (res: { ok: boolean }) => void) => void
}

export type TypingSocket = Socket<ServerEvents, ClientEvents>

/**
 * Opens the server's `/typing` Socket.IO namespace with the session token. It reconnects by
 * itself; call `subscribe` again on every `connect`, since a new connection watches nothing.
 */
export function connectTypingSocket(): TypingSocket {
  return io(`${API_ORIGIN}/typing`, {
    auth: (cb) => cb({ token: getSessionToken() ?? '' }),
    transports: ['websocket'],
  })
}
