import { get, post, put, type ApiResult } from './api-client'
import type { DuelLeaderboard } from '@/types/typing-duel'
import type { TypingLeaderboard, TypingScoreResult } from '@/types/typing-test'

/** The signed-in user's leaderboard name; null until they pick one. */
export function getTypingPlayer(): Promise<ApiResult<{ name: string | null }>> {
  return get('/v1/typing/player')
}

export function saveTypingPlayer(name: string): Promise<ApiResult<{ name: string }>> {
  return put('/v1/typing/player', { name })
}

/** The top 100 for one test setup (a bestKey, e.g. "time-30"). */
export function getLeaderboard(setup: string): Promise<ApiResult<TypingLeaderboard>> {
  return get('/v1/typing/leaderboard', { setup })
}

/** The top 100 by 1v1 races won. */
export function getDuelLeaderboard(): Promise<ApiResult<DuelLeaderboard>> {
  return get('/v1/typing/duel/leaderboard')
}

/** Saves a finished run when it beats the user's best; resolves to the board after. */
export function submitTypingScore(setup: string, wpm: number, accuracy: number): Promise<ApiResult<TypingScoreResult>> {
  return post('/v1/typing/scores', { setup, wpm, accuracy })
}

/** Whether a leaderboard name is free (ignoring case and spacing); the user's own name is. */
export function checkTypingName(name: string): Promise<ApiResult<{ available: boolean }>> {
  return get('/v1/typing/player/name-available', { name })
}
