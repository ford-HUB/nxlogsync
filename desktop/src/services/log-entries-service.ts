import { del, get, patch, post, type ApiResult } from './api-client'
import type { EntryDraft, LogEntry } from '@/types/daily-log'

/** The server's entry; `date` is the local day it belongs to ("YYYY-MM-DD"). */
interface LogEntryWire extends Omit<LogEntry, 'synced' | 'editedSinceSync' | 'endorsed' | 'resyncCount'> {
  date: string
  syncedAt: string | null
  editedSinceSync?: boolean
  endorsedAt?: string | null
  resyncCount?: number
}

function toEntry(wire: LogEntryWire): LogEntry {
  const {
    id,
    startMinutes,
    endMinutes,
    description,
    jobCode,
    workActivityCode,
    syncedAt,
    editedSinceSync,
    endorsedAt,
    resyncCount,
  } = wire
  // An older server leaves the flags out; treat its entries as not edited, endorsed or resynced.
  return {
    id,
    startMinutes,
    endMinutes,
    description,
    jobCode,
    workActivityCode,
    synced: syncedAt !== null,
    editedSinceSync: editedSinceSync ?? false,
    endorsed: endorsedAt != null,
    resyncCount: resyncCount ?? 0,
  }
}

/** Entries from `from` to `to` (inclusive), grouped by day. */
export async function listEntries(from: string, to: string): Promise<ApiResult<Record<string, LogEntry[]>>> {
  const result = await get<LogEntryWire[]>('/v1/log-entries', { from, to })
  if (!result.success) return result
  const byDate: Record<string, LogEntry[]> = {}
  for (const wire of result.data) (byDate[wire.date] ??= []).push(toEntry(wire))
  return { success: true, data: byDate }
}

export async function createEntry(date: string, draft: EntryDraft): Promise<ApiResult<LogEntry>> {
  const result = await post<LogEntryWire>('/v1/log-entries', { date, ...draft })
  return result.success ? { success: true, data: toEntry(result.data) } : result
}

export async function updateEntry(id: string, draft: EntryDraft): Promise<ApiResult<LogEntry>> {
  const result = await patch<LogEntryWire>(`/v1/log-entries/${id}`, draft)
  return result.success ? { success: true, data: toEntry(result.data) } : result
}

/** Moves several of a day's entries at once, so tasks can swap places without overlapping on the way. */
export async function rescheduleEntries(
  date: string,
  moves: { id: string; startMinutes: number; endMinutes: number }[],
): Promise<ApiResult<LogEntry[]>> {
  const result = await post<LogEntryWire[]>('/v1/log-entries/reschedule', { date, moves })
  return result.success ? { success: true, data: result.data.map(toEntry) } : result
}

/** Marks days for upload again (days without entries are skipped); the next sync replaces them on N-PAX. */
export function resyncDays(dates: string[]): Promise<ApiResult<{ dates: string[]; entryCount: number }>> {
  return post('/v1/log-entries/resync', { dates })
}

export function deleteEntry(id: string): Promise<ApiResult<{ id: string }>> {
  return del(`/v1/log-entries/${id}`)
}
