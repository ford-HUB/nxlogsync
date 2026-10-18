/**
 * Native notifications through the preload bridge (see electron/notifications.ts), shown only
 * while the window is minimised, in the tray or unfocused. Quietly does nothing outside Electron.
 */
export function notifyIfAway(id: string, title: string, body: string): void {
  void window.desktopNotifications?.showIfAway({ id, title, body }).catch(() => {
    // A missed notification still leaves the in-app prompt.
  })
}

/** Withdraws a notification whose subject is over. */
export function closeNotification(id: string): void {
  void window.desktopNotifications?.close(id).catch(() => {})
}
