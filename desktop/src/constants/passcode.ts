export const PASSCODE_LENGTH = 6

/** An unlock lasts this long while the app stays open; closing the app always locks it. */
export const PASSCODE_SESSION_MS = 24 * 60 * 60 * 1000
/** How often an open, unlocked app checks whether its session has expired. */
export const PASSCODE_EXPIRY_CHECK_MS = 60_000

/** Wrong entries allowed before the lock screen makes the user wait. */
export const PASSCODE_MAX_ATTEMPTS = 5
export const PASSCODE_COOLDOWN_MS = 30_000

export const PASSCODE_STORAGE_KEY = 'nxlogsync.passcode'

export const PASSCODE_MESSAGE = {
  mismatch: 'Passcodes don’t match. Enter it again.',
  wrong: 'Wrong passcode.',
  resetWrong: 'That isn’t your current passcode.',
  expired: 'Your session expired after 24 hours. Enter your passcode to continue.',
  storageFailed: 'Couldn’t save the passcode on this device.',
} as const
