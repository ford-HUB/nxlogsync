import type { ApiResult } from './api-client'
import type { Printer } from '@/types/printing'

/** Printers installed on this computer, through the main process. */
export async function listPrinters(): Promise<ApiResult<Printer[]>> {
  try {
    return { success: true, data: await window.printing.listPrinters() }
  } catch {
    return { success: false, message: 'Couldn’t read the printers on this computer.' }
  }
}

/** One A4 sheet per image, edge to edge: the images are full rendered PDF pages. */
function pagesDocument(pages: string[]): string {
  const images = pages.map((src) => `<img src="${src}" alt="">`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 0; }
html, body { margin: 0; padding: 0; }
img { display: block; width: 210mm; height: 297mm; break-after: page; }
img:last-child { break-after: auto; }
</style></head><body>${images}</body></html>`
}

/** Prints the page images on `printer` without the system dialog. */
export async function printPages(pages: string[], printer: string, copies: number): Promise<ApiResult<null>> {
  try {
    const result = await window.printing.printHtml({ html: pagesDocument(pages), deviceName: printer, copies })
    return result.ok ? { success: true, data: null } : { success: false, message: result.message }
  } catch {
    return { success: false, message: 'Printing failed. Check the printer and try again.' }
  }
}
