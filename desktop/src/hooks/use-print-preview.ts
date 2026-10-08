import { useEffect, useState } from 'react'
import { MAX_PRINT_COPIES, SAVE_AS_PDF_VALUE, parsePageRanges } from '@/constants/printing'
import { usePrintStore } from '@/store/print-store'

export type PageSelection = 'all' | 'custom'

/**
 * The print preview for a report range: loads the report PDF's pages and the
 * printers when opened, and holds the Destination / Pages / Copies settings.
 */
export function usePrintPreview(open: boolean, from: string, to: string, onDone: () => void) {
  const pages = usePrintStore((s) => s.pages)
  const printers = usePrintStore((s) => s.printers)
  const loading = usePrintStore((s) => s.loading)
  const printing = usePrintStore((s) => s.printing)
  const error = usePrintStore((s) => s.error)
  const load = usePrintStore((s) => s.load)
  const print = usePrintStore((s) => s.print)
  const saveAsPdf = usePrintStore((s) => s.saveAsPdf)
  const reset = usePrintStore((s) => s.reset)

  const [destination, setDestination] = useState('')
  const [pageSelection, setPageSelection] = useState<PageSelection>('all')
  const [customPages, setCustomPages] = useState('')
  const [copies, setCopies] = useState(1)

  useEffect(() => {
    if (!open) {
      reset()
      return
    }
    setPageSelection('all')
    setCustomPages('')
    setCopies(1)
    void load(from, to)
  }, [open, from, to, load, reset])

  // Start on the OS default printer, like the system dialog; Save as PDF when none is installed.
  const defaultDestination = (printers.find((p) => p.isDefault) ?? printers[0])?.name ?? SAVE_AS_PDF_VALUE
  const selectedDestination = destination && (destination === SAVE_AS_PDF_VALUE || printers.some((p) => p.name === destination))
    ? destination
    : defaultDestination
  const savingPdf = selectedDestination === SAVE_AS_PDF_VALUE

  const allPages = pages.map((_, i) => i + 1)
  const pageNumbers = pageSelection === 'all' ? allPages : parsePageRanges(customPages, pages.length)
  const pagesInvalid = pageSelection === 'custom' && customPages.trim() !== '' && pageNumbers === null
  const sheetCount = (pageNumbers?.length ?? 0) * (savingPdf ? 1 : copies)

  const canSubmit = !loading && !printing && pages.length > 0 && pageNumbers !== null && pageNumbers.length > 0

  const submit = async () => {
    if (!canSubmit || !pageNumbers) return
    if (savingPdf) {
      saveAsPdf()
      onDone()
      return
    }
    if (await print(selectedDestination, copies, pageNumbers)) onDone()
  }

  return {
    pages,
    printers,
    loading,
    printing,
    error,
    destination: selectedDestination,
    savingPdf,
    pageSelection,
    customPages,
    copies,
    /** Pages shown in the preview: the picked ones, or all while the range is being typed. */
    previewPages: pageNumbers ?? allPages,
    pagesInvalid,
    sheetCount,
    canSubmit,
    setDestination,
    setPageSelection,
    setCustomPages,
    setCopies: (value: number) => setCopies(Math.min(MAX_PRINT_COPIES, Math.max(1, Math.floor(value) || 1))),
    submit,
  }
}
