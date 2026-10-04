import { create } from 'zustand'
import { CREDENTIALS_INVALID_MESSAGE, TARGET_SITE_NAME } from '@/constants/sync-schedule'
import { setSessionToken } from '@/services/api-client'
import { checkSession, connectSession, disconnectSession, getSessionStatus } from '@/services/credentials-service'
import type { CredentialsCheck, SiteSession, SyncTarget } from '@/types/sync-schedule'

interface SiteSessionState {
  target: SyncTarget
  /** True once the first status check has come back (either way). */
  loaded: boolean
  refreshStatus: () => Promise<void>
  testConnection: () => Promise<void>
  connect: (userId: string, password: string) => Promise<CredentialsCheck>
  /** Ends the server's session so the keep-alive stops logging in. Resolves to an error message, or null. */
  logout: () => Promise<string | null>
}

/** Applies the server's session to the target card; the server owns login state. */
function applySession(target: SyncTarget, session: SiteSession): SyncTarget {
  return {
    ...target,
    userId: session.userId,
    connection: session.state,
    checkedAt: session.checkedAt ? new Date(session.checkedAt) : target.checkedAt,
  }
}

/**
 * The server's N-PAX session. The server logs in (Puppeteer), keeps the session alive and
 * re-logs in when it expires; the app stays locked to Settings until a user is signed in,
 * since every log entry belongs to that user.
 */
export const useSiteSessionStore = create<SiteSessionState>((set) => ({
  target: { name: TARGET_SITE_NAME, userId: null, connection: 'checking', checkedAt: new Date() },
  loaded: false,

  refreshStatus: async () => {
    const result = await getSessionStatus()
    // The server answers for whoever the token names; without one it reports 'disconnected'.
    if (result.success) set((s) => ({ target: applySession(s.target, result.data), loaded: true }))
    // Server down: a held session can't be confirmed, but a logged-out one stays logged out.
    else
      set((s) => ({
        target: s.target.userId === null ? s.target : { ...s.target, connection: 'unreachable' },
        loaded: true,
      }))
  },

  testConnection: async () => {
    set((s) => ({ target: { ...s.target, connection: 'checking' } }))
    const result = await checkSession()
    if (result.success) set((s) => ({ target: applySession(s.target, result.data) }))
    else set((s) => ({ target: { ...s.target, connection: 'unreachable' } }))
  },

  // The password lives only in the server's memory; secure storage on this side comes later (main process).
  connect: async (userId, password) => {
    const result = await connectSession(userId, password)
    if (!result.success) return { status: 'error', message: result.message }
    if (!result.data.valid || !result.data.token) return { status: 'invalid', message: CREDENTIALS_INVALID_MESSAGE }
    setSessionToken(result.data.token)
    set((s) => ({ target: applySession(s.target, result.data.session) }))
    return { status: 'valid' }
  },

  logout: async () => {
    const result = await disconnectSession()
    if (!result.success) return result.message
    setSessionToken(null)
    set((s) => ({ target: applySession(s.target, result.data) }))
    return null
  },
}))
