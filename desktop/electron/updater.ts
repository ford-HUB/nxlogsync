import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater

/**
 * Where an update is, as the renderer's update screen shows it. `none` and `error` leave the app
 * usable; `downloading` and `installing` cover it until the app reopens on the new version.
 */
export type UpdateStatus =
  | { phase: 'none' }
  | { phase: 'downloading'; version: string; percent: number; transferred: number; total: number; bytesPerSecond: number }
  | { phase: 'installing'; version: string }
  | { phase: 'error'; version: string | null; message: string }

/** Long enough to read "Installing…" before the window goes and the installer runs. */
const INSTALL_DELAY_MS = 1500

/**
 * Checks for a new release on start (packaged builds only), downloads it while the update screen
 * shows the progress, then installs it silently and reopens the app. The window stays up the whole
 * time, until the installer itself has to replace the running files.
 */
export function registerUpdater(getWindow: () => BrowserWindow | null): void {
  let status: UpdateStatus = { phase: 'none' }
  let version: string | null = null
  const send = (next: UpdateStatus) => {
    status = next
    getWindow()?.webContents.send('updater:status', status)
  }

  // A window that loads after the update started asks for where it is.
  ipcMain.handle('updater:get-status', (): UpdateStatus => status)

  if (!app.isPackaged) return

  autoUpdater.on('update-available', (info) => {
    version = info.version
    send({ phase: 'downloading', version, percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 })
  })
  autoUpdater.on('download-progress', (p) => {
    send({
      phase: 'downloading',
      version: version ?? '',
      percent: p.percent,
      transferred: p.transferred,
      total: p.total,
      bytesPerSecond: p.bytesPerSecond,
    })
  })
  autoUpdater.on('update-downloaded', (info) => {
    send({ phase: 'installing', version: info.version })
    // Silent install, then the new version opens by itself.
    setTimeout(() => autoUpdater.quitAndInstall(true, true), INSTALL_DELAY_MS)
  })
  autoUpdater.on('error', (err) => {
    console.error('Auto-update failed:', err)
    // Only shown when an update was under way; a failed check alone stays quiet.
    if (status.phase !== 'none') send({ phase: 'error', version, message: err.message })
  })
  autoUpdater.checkForUpdates().catch(() => {
    // Reported through the 'error' event.
  })
}
