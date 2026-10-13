/** Where an app update is, as the main process reports it (see electron/updater.ts). */
export type UpdateStatus = Awaited<ReturnType<Window['updater']['getStatus']>>
