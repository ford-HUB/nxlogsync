import { app, BrowserWindow, Menu, Notification, Tray, nativeImage } from 'electron'
import path from 'node:path'

/** Module-level so the icon isn't garbage-collected out of the tray. */
let tray: Tray | null = null

/** Brings the window back from the tray, the taskbar or behind other windows. */
export function showWindow(win: BrowserWindow | null): void {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

/**
 * Keeps the app running in the system tray when its window is closed, so the user stays online
 * for typing 1v1 invites. Quit from the tray menu (or an update install) really quits. A second
 * launch brings the running window back instead of starting another copy.
 *
 * Returns false when another copy already runs; this one should quit without opening a window.
 */
export function registerTray(getWindow: () => BrowserWindow | null): boolean {
  if (!app.requestSingleInstanceLock()) return false
  app.on('second-instance', () => showWindow(getWindow()))

  let quitting = false
  // Tray Quit, an update install and OS shutdown all go through here first.
  app.on('before-quit', () => {
    quitting = true
  })

  let toldAboutTray = false

  app.on('browser-window-created', (_event, win) => {
    win.on('close', (event) => {
      if (quitting) return
      event.preventDefault()
      win.hide()
      // Once per run: the window is gone but the app isn't, which is easy to miss.
      if (!toldAboutTray && Notification.isSupported()) {
        toldAboutTray = true
        new Notification({
          title: 'NXLogSync is still running',
          body: 'It stays in the tray so you can get typing 1v1 invites. Right-click its icon to quit.',
          silent: true,
        }).show()
      }
    })
  })

  app.whenReady().then(() => {
    const icon = nativeImage.createFromPath(path.join(process.env.VITE_PUBLIC, 'logo-nxlogsync.png'))
    tray = new Tray(icon.resize({ width: 16, height: 16 }))
    tray.setToolTip('NXLogSync')
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Open NXLogSync', click: () => showWindow(getWindow()) },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() },
      ]),
    )
    tray.on('click', () => showWindow(getWindow()))
  })

  return true
}
