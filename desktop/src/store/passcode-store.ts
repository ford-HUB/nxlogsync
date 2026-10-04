import { create } from 'zustand'
import { PASSCODE_MESSAGE, PASSCODE_SESSION_MS } from '@/constants/passcode'
import { hasPasscode, savePasscode, verifyPasscode } from '@/services/passcode-service'

export type PasscodeStatus = 'setup' | 'locked' | 'unlocked'

interface PasscodeState {
  status: PasscodeStatus
  /**
   * When the current unlock started. Held in memory only, so quitting the app
   * always ends the session and the next launch asks for the passcode.
   */
  unlockedAt: number | null
  /** Why the app locked itself, shown on the lock screen. */
  lockReason: string | null
  /**
   * True while an unlocked user is choosing a new passcode. The old one stays
   * saved until the new one is confirmed, so quitting mid-reset keeps the lock.
   */
  replacing: boolean
  createPasscode: (passcode: string) => Promise<string | null>
  unlock: (passcode: string) => Promise<boolean>
  lock: (reason?: string) => void
  /** Checks the current passcode, then sends the user to choose a new one. */
  resetPasscode: (current: string) => Promise<boolean>
  /** Leaves passcode creation and goes back into the app with the old passcode. */
  cancelReset: () => void
  /** Locks the app once the unlock is older than the session length. */
  checkExpiry: () => void
}

export const usePasscodeStore = create<PasscodeState>((set, get) => ({
  status: hasPasscode() ? 'locked' : 'setup',
  unlockedAt: null,
  lockReason: null,
  replacing: false,

  createPasscode: async (passcode) => {
    if (!(await savePasscode(passcode))) return PASSCODE_MESSAGE.storageFailed
    set({ status: 'unlocked', unlockedAt: Date.now(), lockReason: null, replacing: false })
    return null
  },

  unlock: async (passcode) => {
    if (!(await verifyPasscode(passcode))) return false
    set({ status: 'unlocked', unlockedAt: Date.now(), lockReason: null })
    return true
  },

  lock: (reason) => set({ status: 'locked', unlockedAt: null, lockReason: reason ?? null, replacing: false }),

  resetPasscode: async (current) => {
    if (!(await verifyPasscode(current))) return false
    // Keep unlockedAt: choosing a new passcode doesn't extend the 24-hour session.
    set({ status: 'setup', replacing: true })
    return true
  },

  cancelReset: () => {
    if (get().replacing) set({ status: 'unlocked', replacing: false })
  },

  checkExpiry: () => {
    const { status, unlockedAt, lock } = get()
    // Also runs mid-reset: an expired session falls back to the lock screen and the old passcode.
    if (status === 'locked' || unlockedAt === null) return
    if (Date.now() - unlockedAt >= PASSCODE_SESSION_MS) lock(PASSCODE_MESSAGE.expired)
  },
}))
