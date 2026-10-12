import { get, put, type ApiResult } from './api-client'
import type { RunBindings } from '@/types/run-controls'

/** The account's Run yourself keys; null until first saved. */
export function getRunSettings(): Promise<ApiResult<{ keys: RunBindings | null }>> {
  return get('/v1/run-yourself/settings')
}

/** The server checks the keys again: a key doing two things in one game is refused. */
export function saveRunSettings(keys: RunBindings): Promise<ApiResult<{ keys: RunBindings }>> {
  return put('/v1/run-yourself/settings', { keys })
}
