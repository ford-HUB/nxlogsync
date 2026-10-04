import { useEffect } from 'react'
import { PASSCODE_EXPIRY_CHECK_MS } from '@/constants/passcode'
import { usePasscodeStore } from '@/store/passcode-store'

/**
 * Re-checks the unlock session on a timer and whenever the window comes back
 * into view, so an app left open (or a machine that slept) locks after a day.
 */
export function usePasscodeExpiry() {
  const status = usePasscodeStore((s) => s.status)
  const checkExpiry = usePasscodeStore((s) => s.checkExpiry)

  useEffect(() => {
    if (status === 'locked') return
    const timer = window.setInterval(checkExpiry, PASSCODE_EXPIRY_CHECK_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkExpiry()
    }
    window.addEventListener('focus', checkExpiry)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', checkExpiry)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [status, checkExpiry])
}
