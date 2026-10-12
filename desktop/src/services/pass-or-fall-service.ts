import { get, post, put, type ApiResult } from './api-client'
import type { PassOrFallLeaderboard, PassOrFallProgress, PassOrFallScoreResult } from '@/types/run-rooms'

/** Where Continue resumes; null until the first door is unlocked. */
export function getPassOrFallProgress(): Promise<ApiResult<{ progress: PassOrFallProgress | null }>> {
  return get('/v1/run-yourself/pass-or-fall/progress')
}

/** A door just unlocked. The server keeps it only when it's further than before, and answers with what it kept. */
export function savePassOrFallProgress(progress: PassOrFallProgress): Promise<ApiResult<{ progress: PassOrFallProgress | null }>> {
  return put('/v1/run-yourself/pass-or-fall/progress', progress)
}

export function getPassOrFallLeaderboard(): Promise<ApiResult<PassOrFallLeaderboard>> {
  return get('/v1/run-yourself/pass-or-fall/leaderboard')
}

/** A finished run; the server keeps it only when it is a personal best, and returns the board after. */
export function submitPassOrFallScore(points: number, levels: number, seconds: number): Promise<ApiResult<PassOrFallScoreResult>> {
  return post('/v1/run-yourself/pass-or-fall/scores', { points, levels, seconds })
}
