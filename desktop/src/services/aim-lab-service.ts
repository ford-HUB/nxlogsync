import { get, post, put, type ApiResult } from './api-client'
import type { AimLabLeaderboard, AimLabScoreEvent, AimLabScoreResult, AimLabSetup } from '@/types/aim-lab'

/** The top 100 for one round length, e.g. "dot-gridshot-60". */
export function getAimLabLeaderboard(setup: AimLabSetup): Promise<ApiResult<AimLabLeaderboard>> {
  return get('/v1/aim-lab/leaderboard', { setup })
}

/** Saves a finished session when it beats the user's best; resolves to the board after. */
export function submitAimLabScore(session: AimLabScoreEvent): Promise<ApiResult<AimLabScoreResult>> {
  const { setup, score, accuracy, shotsFired, shotsHit } = session
  return post('/v1/aim-lab/scores', { setup, score, accuracy, shotsFired, shotsHit })
}

/** The signed-in user's saved sensitivity; null until they first save one. */
export function getAimLabSettings(): Promise<ApiResult<{ sensitivity: number | null }>> {
  return get('/v1/aim-lab/settings')
}

export function saveAimLabSettings(sensitivity: number): Promise<ApiResult<{ sensitivity: number }>> {
  return put('/v1/aim-lab/settings', { sensitivity })
}
