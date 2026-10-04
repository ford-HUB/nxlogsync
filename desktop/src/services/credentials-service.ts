import { get, post, type ApiResult } from './api-client'
import type { SiteSession } from '@/types/sync-schedule'

/** Logs in to the target site with these credentials (server-side, headless) and reports whether it worked. */
export function verifyCredentials(userId: string, password: string): Promise<ApiResult<{ valid: boolean }>> {
  return post('/v1/credentials/verify', { userId, password })
}

/**
 * Logs in and keeps the session alive on the server; it re-logs in on its own when the site expires it.
 * `token` (null when the login was rejected) identifies this user on every later request.
 */
export function connectSession(
  userId: string,
  password: string,
): Promise<ApiResult<{ valid: boolean; session: SiteSession; token: string | null }>> {
  return post('/v1/credentials/connect', { userId, password })
}

export function disconnectSession(): Promise<ApiResult<SiteSession>> {
  return post('/v1/credentials/disconnect', {})
}

export function getSessionStatus(): Promise<ApiResult<SiteSession>> {
  return get('/v1/credentials/status')
}

/** Runs the server's keep-alive check now (re-logging in if needed) instead of waiting for its schedule. */
export function checkSession(): Promise<ApiResult<SiteSession>> {
  return post('/v1/credentials/check', {})
}
