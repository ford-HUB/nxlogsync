import { get, getFile, type ApiFile, type ApiResult } from './api-client'
import type { EntriesReport, ReportFileFormat } from '@/types/reports'

/** Entries from the first day of `from` to the last day of `to` ("YYYY-MM"), grouped by month. */
export function getEntriesReport(from: string, to: string): Promise<ApiResult<EntriesReport>> {
  return get('/v1/reports/entries', { from, to })
}

/** The same report rendered by the server as a PDF or an Excel workbook. */
export function downloadEntriesReport(format: ReportFileFormat, from: string, to: string): Promise<ApiResult<ApiFile>> {
  return getFile(`/v1/reports/entries/${format}`, { from, to })
}
