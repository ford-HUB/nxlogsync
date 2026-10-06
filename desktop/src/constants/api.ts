/**
 * Server calls that drive a headless browser (e.g. a site login) can take a while,
 * and the free-tier server needs ~50s to wake from sleep before it even starts.
 */
export const API_TIMEOUT_MS = 180_000

/** localStorage key for the session token the server issues on Connect. */
export const SESSION_TOKEN_STORAGE_KEY = 'nxlogsync.session-token'

export const API_UNREACHABLE_MESSAGE = 'Can’t reach the NXLogSync server. Check that it’s running.'
