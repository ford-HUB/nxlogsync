import { create } from 'zustand'
import { DEFAULT_TYPING_CONFIG } from '@/constants/typing-test'
import type { TypingConfig } from '@/types/typing-test'

const CONFIG_KEY = 'nxlogsync-typing-config'
const BESTS_KEY = 'nxlogsync-typing-bests'

function read<T>(key: string, fallback: T): T {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (saved && typeof saved === 'object') return { ...fallback, ...saved }
  } catch {
    // Storage unavailable or corrupt; start from the fallback.
  }
  return fallback
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Not persisted; kept for this session only.
  }
}

/** Personal bests are kept per exact setup: a 15s test with punctuation is its own record. */
export const bestKey = ({ mode, amount, punctuation, numbers }: TypingConfig) =>
  `${mode}-${amount}${punctuation ? '-punctuation' : ''}${numbers ? '-numbers' : ''}`

interface TypingTestState {
  config: TypingConfig
  /** Best net wpm per bestKey. */
  bests: Record<string, number>
  setConfig: (patch: Partial<TypingConfig>) => void
  /** Records the wpm when it beats the best for that setup; true when it did. */
  submitBest: (config: TypingConfig, wpm: number) => boolean
}

export const useTypingTestStore = create<TypingTestState>((set, get) => ({
  config: read(CONFIG_KEY, DEFAULT_TYPING_CONFIG),
  bests: read<Record<string, number>>(BESTS_KEY, {}),

  setConfig: (patch) => {
    const config = { ...get().config, ...patch }
    write(CONFIG_KEY, config)
    set({ config })
  },

  submitBest: (config, wpm) => {
    const key = bestKey(config)
    if (wpm <= (get().bests[key] ?? 0)) return false
    const bests = { ...get().bests, [key]: wpm }
    write(BESTS_KEY, bests)
    set({ bests })
    return true
  },
}))
