import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/** Renders every page of a PDF to a PNG data URL, `scale` × 72 dpi. */
export async function renderPdfPages(pdf: Blob, scale: number): Promise<string[]> {
  // Loaded on first use so pdf.js stays out of the app's startup bundle.
  const { GlobalWorkerOptions, getDocument } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = workerUrl

  const doc = await getDocument({ data: new Uint8Array(await pdf.arrayBuffer()) }).promise
  try {
    const pages: string[] = []
    for (let number = 1; number <= doc.numPages; number++) {
      const page = await doc.getPage(number)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas is unavailable')
      await page.render({ canvasContext: context, viewport }).promise
      pages.push(canvas.toDataURL('image/png'))
      page.cleanup()
    }
    return pages
  } finally {
    await doc.destroy()
  }
}
