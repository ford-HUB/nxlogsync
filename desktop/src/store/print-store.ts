import { create } from 'zustand'
import { PRINT_RENDER_SCALE } from '@/constants/printing'
import { renderPdfPages } from '@/services/pdf-pages-service'
import { listPrinters, printPages } from '@/services/printing-service'
import { saveFile } from '@/services/report-file-service'
import { downloadEntriesReport } from '@/services/reports-service'
import type { Printer } from '@/types/printing'

interface PrintState {
  /** The report PDF's pages as images, for the preview and the printout. */
  pages: string[]
  pdf: Blob | null
  fileName: string
  printers: Printer[]
  loading: boolean
  printing: boolean
  error: string | null
  /** Downloads the report PDF for the range, renders its pages, and lists the printers. */
  load: (from: string, to: string) => Promise<void>
  /** Prints the given 1-based pages; resolves true once the printer accepted the job. */
  print: (printer: string, copies: number, pageNumbers: number[]) => Promise<boolean>
  saveAsPdf: () => void
  reset: () => void
}

const initialState = { pages: [], pdf: null, fileName: '', printers: [], loading: false, printing: false, error: null }

// Drops a load that finished after the dialog closed or reopened.
let latestLoad = 0

export const usePrintStore = create<PrintState>((set, get) => ({
  ...initialState,

  load: async (from, to) => {
    const load = ++latestLoad
    set({ ...initialState, loading: true })
    const [file, printers] = await Promise.all([downloadEntriesReport('pdf', from, to), listPrinters()])
    if (load !== latestLoad) return
    if (!file.success) return set({ loading: false, error: file.message })
    try {
      const pages = await renderPdfPages(file.data.blob, PRINT_RENDER_SCALE)
      if (load !== latestLoad) return
      set({
        pages,
        pdf: file.data.blob,
        fileName: file.data.fileName ?? `entries-report-${from}.pdf`,
        printers: printers.success ? printers.data : [],
        loading: false,
        error: printers.success ? null : printers.message,
      })
    } catch {
      if (load === latestLoad) set({ loading: false, error: 'Couldn’t render the report preview.' })
    }
  },

  print: async (printer, copies, pageNumbers) => {
    const { pages, printing } = get()
    if (printing || pages.length === 0) return false
    set({ printing: true, error: null })
    const result = await printPages(
      pageNumbers.map((n) => pages[n - 1]),
      printer,
      copies,
    )
    set({ printing: false, error: result.success ? null : result.message })
    return result.success
  },

  saveAsPdf: () => {
    const { pdf, fileName } = get()
    if (pdf) saveFile(pdf, fileName)
  },

  reset: () => {
    latestLoad++
    set(initialState)
  },
}))
