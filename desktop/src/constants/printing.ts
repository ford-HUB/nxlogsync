/** Render scale for preview and print pages: 2.5 × 72 dpi ≈ 180 dpi, sharp on paper. */
export const PRINT_RENDER_SCALE = 2.5

export const MAX_PRINT_COPIES = 99

/** The Destination value that saves a PDF instead of printing. */
export const SAVE_AS_PDF_VALUE = '__save-as-pdf__'

/**
 * "1-3, 5" → [1, 2, 3, 5] (1-based, sorted, no repeats). Null when the text
 * isn't a valid list of pages between 1 and `pageCount`.
 */
export function parsePageRanges(text: string, pageCount: number): number[] | null {
  const pages = new Set<number>()
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null
  for (const part of parts) {
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part)
    if (!match) return null
    const start = Number(match[1])
    const end = match[2] ? Number(match[2]) : start
    if (start < 1 || end < start || end > pageCount) return null
    for (let page = start; page <= end; page++) pages.add(page)
  }
  return [...pages].sort((a, b) => a - b)
}
