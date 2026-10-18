import type { TypingMode } from './typing-test'

/** The races two players can vote for; both have to pick the same one to start. */
export type DuelOption = 'short' | 'medium' | 'long' | 'speed'

/** Seconds a race may last, also voted on: a Speed race's length, a words race's time limit. */
export type DuelDuration = 15 | 30 | 60 | 120

/** A vote on the race, the time, or both. */
export interface DuelVote {
  option?: DuelOption
  duration?: DuelDuration
}

export type DuelPhase = 'voting' | 'countdown' | 'racing' | 'finished' | 'closed'

/** Someone else online with a leaderboard name. */
export interface OnlinePlayer {
  userId: string
  name: string
  /** In a 1v1 already, so they can't be invited. */
  busy: boolean
  /** Who they're racing while busy. */
  opponent: string | null
}

/** A challenge someone sent the user. */
export interface DuelInvite {
  id: string
  from: { userId: string; name: string }
  /** When it lapses, in this machine's clock. */
  expiresAt: number
}

export type InviteClosedReason = 'accepted' | 'declined' | 'cancelled' | 'expired' | 'busy' | 'offline'

/** An invite the user sent, per invited player. */
export interface OutgoingInvite {
  inviteId: string | null
  status: 'sending' | 'pending' | 'declined' | 'expired' | 'failed'
  /** When a pending invite lapses, in this machine's clock. */
  expiresAt?: number
  message?: string
}

/** Where a racer is: their caret's word and letter, and the correct characters behind it. */
export interface DuelProgress {
  word: number
  char: number
  correct: number
  wpm: number
}

export interface DuelPlayer {
  userId: string
  name: string
  vote: DuelOption | null
  durationVote: DuelDuration | null
  /** Races won in this 1v1. */
  points: number
  /** Asked for another race after this one. */
  rematch: boolean
  result: { wpm: number; accuracy: number; correct: number } | null
  progress: DuelProgress
}

/** The 1v1 as the server sends it, from the user's side. */
export interface DuelMatch {
  id: string
  /** 1 for the first race, +1 per rematch. */
  round: number
  phase: DuelPhase
  option: DuelOption | null
  /** amount: seconds or words; limit: the voted time, the most the race lasts. */
  config: { mode: TypingMode; amount: number; limit: number } | null
  /** The race's words from the countdown on; empty while voting. */
  words: string[]
  /** When the countdown ends, in this machine's clock. */
  startsAt: number
  you: DuelPlayer
  opponent: DuelPlayer
  winner: 'you' | 'opponent' | 'draw' | null
  /** Why a 'closed' match ended: the opponent left mid-race (a forfeit) or between races. */
  closedReason: 'left' | 'forfeit' | null
}

/** One player's 1v1 record on the leaderboard. */
export interface DuelLeaderboardEntry {
  id: string
  name: string
  /** Races won: a point each, as in the match score. */
  points: number
  wins: number
  losses: number
  draws: number
  /** The signed-in user's own row. */
  you: boolean
}

/** The players with the most 1v1 wins, and the user's own record. */
export interface DuelLeaderboard {
  /** Most points first. */
  entries: DuelLeaderboardEntry[]
  /** Null before the user's first decided race. */
  you: { rank: number; points: number; wins: number; losses: number; draws: number } | null
}
