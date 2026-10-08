import { app, BrowserWindow, ipcMain } from 'electron'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

/** A printer as the renderer's print dialog lists it. */
export interface PrinterSummary {
  name: string
  displayName: string
  isDefault: boolean
}

/** A ready-made HTML document (the report's pages as images) and where to print it. */
export interface PrintRequest {
  html: string
  deviceName: string
  copies: number
}

export type PrintResult = { ok: true } | { ok: false; message: string }

const MAX_COPIES = 99

/**
 * Printing for the renderer's own print preview: Windows' dialog shows no preview
 * for Electron apps, so the app lists printers itself and prints without a dialog.
 */
export function registerPrintingHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('printing:list-printers', async (): Promise<PrinterSummary[]> => {
    const win = getWindow()
    if (!win) return []
    const printers = await win.webContents.getPrintersAsync()
    return printers.map((p) => ({ name: p.name, displayName: p.displayName || p.name, isDefault: p.isDefault }))
  })

  ipcMain.handle('printing:print-html', async (_event, request: PrintRequest): Promise<PrintResult> => {
    if (typeof request?.html !== 'string' || typeof request.deviceName !== 'string' || request.deviceName === '') {
      return { ok: false, message: 'Pick a printer first.' }
    }
    const copies = Math.min(MAX_COPIES, Math.max(1, Math.floor(Number(request.copies) || 1)))

    // Large pages as data URLs go through a temp file rather than a data: URL navigation.
    const dir = await mkdtemp(path.join(app.getPath('temp'), 'nxlogsync-print-'))
    const file = path.join(dir, 'print.html')
    const printWin = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } })
    try {
      await writeFile(file, request.html, 'utf8')
      await printWin.loadFile(file)
      return await new Promise<PrintResult>((resolve) => {
        printWin.webContents.print(
          {
            silent: true,
            deviceName: request.deviceName,
            copies,
            printBackground: true,
            pageSize: 'A4',
            margins: { marginType: 'none' },
          },
          (success, failureReason) =>
            resolve(success ? { ok: true } : { ok: false, message: failureReason || 'The printer did not accept the job.' }),
        )
      })
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    } finally {
      printWin.destroy()
      await rm(dir, { recursive: true, force: true })
    }
  })
}
