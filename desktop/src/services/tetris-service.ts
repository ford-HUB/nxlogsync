import { get, post, put, type ApiResult } from './api-client'
import type { TetrisKeyBindings, TetrisLeaderboard, TetrisScoreResult } from '@/types/tetris'

/** The top 100 for one start level (a tetrisBestKey, e.g. "level-15"). */
export function getTetrisLeaderboard(setup: string): Promise<ApiResult<TetrisLeaderboard>> {
  return get('/v1/tetris/leaderboard', { setup })
}

/** Saves a finished game when it beats the user's best; resolves to the board after. */
export function submitTetrisScore(
  setup: string,
  score: number,
  lines: number,
  level: number,
): Promise<ApiResult<TetrisScoreResult>> {
  return post('/v1/tetris/scores', { setup, score, lines, level })
}

/** The signed-in user's saved controls; keys is null until they first save them. */
export function getTetrisSettings(): Promise<ApiResult<{ keys: TetrisKeyBindings | null }>> {
  return get('/v1/tetris/settings')
}

export function saveTetrisSettings(keys: TetrisKeyBindings): Promise<ApiResult<{ keys: TetrisKeyBindings }>> {
  return put('/v1/tetris/settings', { keys })
}
