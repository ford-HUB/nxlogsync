import { create } from 'zustand'
import { saveFile } from '@/services/report-file-service'
import { downloadEntriesReport, getEntriesReport } from '@/services/reports-service'
import type { EntriesReport, ReportFileFormat } from '@/types/reports'

interface ReportsState {
  report: EntriesReport | null
  loading: boolean
  /** The export in progress, if any. */
  busy: ReportFileFormat | null
  error: string | null
  fetchReport: (from: string, to: string) => Promise<void>
  /** Downloads the server's PDF or Excel file and hands it to the save dialog. */
  exportReport: (format: ReportFileFormat, from: string, to: string) => Promise<void>
  dismissError: () => void
  /** Forgets the signed-out user's report so the next user never sees it. */
  reset: () => void
}

const initialState = { report: null, loading: false, busy: null, error: null }

// Drops responses for a range that's no longer the one being viewed.
let latestRequest = 0

export const useReportsStore = create<ReportsState>((set, get) => ({
  ...initialState,

  fetchReport: async (from, to) => {
    const request = ++latestRequest
    set({ loading: true, error: null })
    const result = await getEntriesReport(from, to)
    if (request !== latestRequest) return
    if (result.success) set({ report: result.data, loading: false })
    else set({ report: null, loading: false, error: result.message })
  },

  exportReport: async (format, from, to) => {
    if (get().busy) return
    set({ busy: format, error: null })
    const result = await downloadEntriesReport(format, from, to)
    if (result.success) saveFile(result.data.blob, result.data.fileName ?? `entries-report-${from}.${format}`)
    set({ busy: null, error: result.success ? null : result.message })
  },

  dismissError: () => set({ error: null }),

  reset: () => set(initialState),
}))
