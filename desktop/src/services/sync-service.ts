import { get, post, put, type ApiResult } from './api-client'
import type { PendingUpload, SyncRun, SyncSchedule } from '@/types/sync-schedule'

interface SyncRunWire extends Omit<SyncRun, 'startedAt' | 'message'> {
  startedAt: string
  finishedAt: string | null
  message: string | null
}

function toRun({ id, startedAt, trigger, status, entryCount, minutes, message }: SyncRunWire): SyncRun {
  return { id, startedAt: new Date(startedAt), trigger, status, entryCount, minutes, message: message ?? undefined }
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

/** Starts an upload on the server; the returned run is still 'running' — poll listRuns for the outcome. */
export async function startRun(): Promise<ApiResult<SyncRun>> {
  const result = await post<SyncRunWire>('/v1/sync/runs', {})
  return result.success ? { success: true, data: toRun(result.data) } : result
}

export function getPending(): Promise<ApiResult<PendingUpload>> {
  return get('/v1/sync/pending')
}
