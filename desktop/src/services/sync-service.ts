import { ENDORSE_TIMEOUT_MS } from '@/constants/api'
import { del, get, post, put, type ApiResult } from './api-client'
import type { AutoEndorseSetting, EndorseOutcome, PendingUpload, SyncRun, SyncSchedule } from '@/types/sync-schedule'

interface SyncRunWire extends Omit<SyncRun, 'startedAt' | 'message' | 'cleared'> {
  startedAt: string
  finishedAt: string | null
  message: string | null
  clearedAt: string | null
}

function toRun({ id, startedAt, trigger, status, entryCount, minutes, message, clearedAt }: SyncRunWire): SyncRun {
  return {
    id,
    startedAt: new Date(startedAt),
    trigger,
    status,
    entryCount,
    minutes,
    message: message ?? undefined,
    cleared: clearedAt !== null,
  }
}

export function getSchedule(): Promise<ApiResult<SyncSchedule>> {
  return get('/v1/sync/schedule')
}

export function saveSchedule(schedule: SyncSchedule): Promise<ApiResult<SyncSchedule>> {
  return put('/v1/sync/schedule', schedule)
}

/** Newest first. */
export async function listRuns(): Promise<ApiResult<SyncRun[]>> {
  const result = await get<SyncRunWire[]>('/v1/sync/runs')
  return result.success ? { success: true, data: result.data.map(toRun) } : result
}

/** Hides finished runs from Recent syncs; the server keeps them for the record. */
export function clearRuns(): Promise<ApiResult<{ cleared: number }>> {
  return del('/v1/sync/runs')
}

/** Starts an upload on the server; the returned run is still 'running' — poll listRuns for the outcome. */
export async function startRun(): Promise<ApiResult<SyncRun>> {
  const result = await post<SyncRunWire>('/v1/sync/runs', {})
  return result.success ? { success: true, data: toRun(result.data) } : result
}

export function getPending(): Promise<ApiResult<PendingUpload>> {
  return get('/v1/sync/pending')
}

/** Endorses one synced day to its checker on N-PAX. This can't be undone. */
export function endorseDay(date: string): Promise<ApiResult<{ date: string; outcome: EndorseOutcome }>> {
  return post('/v1/sync/endorse', { date }, { timeoutMs: ENDORSE_TIMEOUT_MS })
}

export function getAutoEndorse(): Promise<ApiResult<AutoEndorseSetting>> {
  return get('/v1/sync/auto-endorse')
}

export function saveAutoEndorse(setting: AutoEndorseSetting): Promise<ApiResult<AutoEndorseSetting>> {
  return put('/v1/sync/auto-endorse', setting)
}
