/** Server calls that drive a headless browser (e.g. a site login) can take a while. */
export const API_TIMEOUT_MS = 90_000

/** localStorage key for the session token the server issues on Connect. */
export const SESSION_TOKEN_STORAGE_KEY = 'nxlogsync.session-token'

export const API_UNREACHABLE_MESSAGE = 'Can’t reach the NXLogSync server. Check that it’s running.'
