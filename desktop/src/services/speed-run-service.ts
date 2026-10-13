import { get, post, type ApiResult } from './api-client'
import type { SpeedRunLeaderboard, SpeedRunScoreResult } from '@/types/run-yourself'

export function getSpeedRunLeaderboard(): Promise<ApiResult<SpeedRunLeaderboard>> {
  return get('/v1/run-yourself/speed-run/leaderboard')
}

/** A run that crossed the line; the server keeps it only when it is a personal best, and returns the board after. */
export function submitSpeedRunScore(points: number, seconds: number): Promise<ApiResult<SpeedRunScoreResult>> {
  return post('/v1/run-yourself/speed-run/scores', { points, seconds })
}
