import { useEffect } from 'react'
import { SESSION_POLL_MS } from '@/constants/sync-schedule'
import { useSiteSessionStore } from '@/store/site-session-store'

/** Polls the server's N-PAX session for the whole app. Mount once, above both screens. */
export function useSiteSessionPolling() {
  const refreshStatus = useSiteSessionStore((s) => s.refreshStatus)

  useEffect(() => {
    void refreshStatus()
    const id = window.setInterval(() => void refreshStatus(), SESSION_POLL_MS)
    return () => window.clearInterval(id)
  }, [refreshStatus])
}

/** Whether a user is signed in on the server (it may be mid-reconnect or briefly unreachable). */
export function useIsSignedIn() {
  return useSiteSessionStore((s) => s.target.userId !== null)
}
