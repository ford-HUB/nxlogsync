import { useEffect, useState } from 'react'
import type { UpdateStatus } from '@/types/updater'

/**
 * The app update as it happens: downloading, then installing (the app reopens by itself), or an
 * error the user can dismiss. `none` outside Electron or with no update.
 */
export function useAppUpdate() {
  const [status, setStatus] = useState<UpdateStatus>({ phase: 'none' })

  useEffect(() => {
    const updater = window.updater
    if (!updater) return
    let live = true
    // The update may have started before this window loaded.
    void updater.getStatus().then((s) => live && setStatus(s))
    const off = updater.onStatus(setStatus)
    return () => {
      live = false
      off()
    }
  }, [])

  return { status, dismiss: () => setStatus({ phase: 'none' }) }
}
