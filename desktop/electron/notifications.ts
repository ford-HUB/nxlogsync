import { BrowserWindow, ipcMain, Notification } from 'electron'
import { showWindow } from './tray'

/** A desktop notification the renderer asks for; `id` lets it be withdrawn later. */
export interface NotifyRequest {
  id: string
  title: string
  body: string
}

/**
 * Native notifications (the card Windows shows in the bottom-right corner), only while the user
 * is away from the window: minimised, closed to the tray, or behind other windows. Clicking one
 * opens the app, where the renderer is already showing what it was about. The taskbar button
 * flashes too until the window is focused.
 */
export function registerNotifications(getWindow: () => BrowserWindow | null): void {
  const shown = new Map<string, Notification>()

  // notifications:show-if-away { id, title, body } → true when a notification was shown
  ipcMain.handle('notifications:show-if-away', (_event, request: NotifyRequest): boolean => {
    const win = getWindow()
    const away = !win || !win.isVisible() || win.isMinimized() || !win.isFocused()
    if (!away || !Notification.isSupported()) return false

    shown.get(request.id)?.close()
    const notification = new Notification({ title: request.title, body: request.body })
    notification.on('click', () => {
      shown.delete(request.id)
      showWindow(getWindow())
    })
    notification.on('close', () => shown.delete(request.id))
    shown.set(request.id, notification)
    notification.show()
    win?.flashFrame(true)
    return true
  })

  // notifications:close { id } — the thing it was about is over (e.g. the invite expired)
  ipcMain.handle('notifications:close', (_event, id: string) => {
    shown.get(id)?.close()
    shown.delete(id)
    if (shown.size === 0) getWindow()?.flashFrame(false)
  })
}
