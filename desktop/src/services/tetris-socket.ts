import { io, type Socket } from 'socket.io-client'
import { API_ORIGIN, getSessionToken } from './api-client'
import type { TetrisLeaderboardEntry } from '@/types/tetris'

/** What the server pushes on `leaderboard` when someone sets a new best on a watched start level. */
export interface TetrisLeaderboardPush {
  setup: string
  entries: TetrisLeaderboardEntry[]
}

interface ServerEvents {
  leaderboard: (push: TetrisLeaderboardPush) => void
  unauthorized: (body: { message: string }) => void
}

interface ClientEvents {
  subscribe: (body: { setup: string }, ack: (res: { ok: boolean }) => void) => void
}

export type TetrisSocket = Socket<ServerEvents, ClientEvents>

/**
 * Opens the server's `/tetris` Socket.IO namespace with the session token. It reconnects by
 * itself; call `subscribe` again on every `connect`, since a new connection watches nothing.
 */
export function connectTetrisSocket(): TetrisSocket {
  return io(`${API_ORIGIN}/tetris`, {
    auth: (cb) => cb({ token: getSessionToken() ?? '' }),
    transports: ['websocket'],
  })
}
