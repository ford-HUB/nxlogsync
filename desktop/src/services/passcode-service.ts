import { PASSCODE_STORAGE_KEY } from '@/constants/passcode'

/** What is kept on disk: a salted hash, never the passcode itself. */
interface StoredPasscode {
  salt: string
  hash: string
}

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('')
}

async function hashPasscode(passcode: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${passcode}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

function readStored(): StoredPasscode | null {
  try {
    const raw = localStorage.getItem(PASSCODE_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && 'salt' in parsed && 'hash' in parsed) {
      return parsed as StoredPasscode
    }
    return null
  } catch {
    return null
  }
}

export function hasPasscode(): boolean {
  return readStored() !== null
}

/** Resolves to false when the device storage refused the write. */
export async function savePasscode(passcode: string): Promise<boolean> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const stored: StoredPasscode = { salt, hash: await hashPasscode(passcode, salt) }
  try {
    localStorage.setItem(PASSCODE_STORAGE_KEY, JSON.stringify(stored))
    return true
  } catch {
    return false
  }
}

export async function verifyPasscode(passcode: string): Promise<boolean> {
  const stored = readStored()
  if (!stored) return false
  return (await hashPasscode(passcode, stored.salt)) === stored.hash
}
