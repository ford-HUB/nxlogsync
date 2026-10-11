import { get, post, type ApiResult } from './api-client'
import type { TetrisLeaderboard, TetrisScoreResult } from '@/types/tetris'

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
