import { del, get, patch, post, type ApiResult } from './api-client'
import type { EntryDraft, LogEntry } from '@/types/daily-log'

/** The server's entry; `date` is the local day it belongs to ("YYYY-MM-DD"). */
interface LogEntryWire extends LogEntry {
  date: string
  syncedAt: string | null
}

function toEntry({ id, startMinutes, endMinutes, description, jobCode, workActivityCode }: LogEntryWire): LogEntry {
  return { id, startMinutes, endMinutes, description, jobCode, workActivityCode }
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

export function deleteEntry(id: string): Promise<ApiResult<{ id: string }>> {
  return del(`/v1/log-entries/${id}`)
}
