import { create } from 'zustand'
import { DEFAULT_TETRIS_CONFIG, DEFAULT_TETRIS_KEYS } from '@/constants/tetris'
import { getTetrisSettings, saveTetrisSettings } from '@/services/tetris-service'
import type { TetrisConfig, TetrisKeyBindings } from '@/types/tetris'

const CONFIG_KEY = 'nxlogsync-tetris-config'
const KEYS_KEY = 'nxlogsync-tetris-keys'
/**
 * v2 since SRS, T-spin, back-to-back and combo scoring: games before it scored lower, so the old
 * bests (under the unversioned key) are left behind, as the server board was cleared.
 */
const BESTS_KEY = 'nxlogsync-tetris-bests-v2'

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

/** Bests are kept per start level; the ghost piece doesn't change the record. */
export const tetrisBestKey = ({ startLevel }: TetrisConfig) => `level-${startLevel}`

interface TetrisBest {
  score: number
  lines: number
}

/** Where the controls are kept: only on this machine (signed out), or on the account. */
export type TetrisKeysSync = 'local' | 'loading' | 'saving' | 'saved' | 'error'

interface TetrisState {
  config: TetrisConfig
  /** Best game per tetrisBestKey. */
  bests: Record<string, TetrisBest>
  /** The player's controls; kept apart from config so changing them doesn't restart the game. */
  keys: TetrisKeyBindings
  keysSync: TetrisKeysSync
  /** The account the controls sync with; null when signed out. */
  keysUser: string | null
  setConfig: (patch: Partial<TetrisConfig>) => void
  /** Saves on this machine, and on the account when signed in. */
  setKeys: (keys: TetrisKeyBindings) => void
  /**
   * Follows the signed-in account: its saved controls replace this machine's; an account without
   * any takes this machine's. Null (signed out) keeps them local only.
   */
  syncKeys: (userId: string | null) => Promise<void>
  /** Records the game when it beats the best for that start level; true when it did. */
  submitBest: (config: TetrisConfig, score: number, lines: number) => boolean
}

export const useTetrisStore = create<TetrisState>((set, get) => ({
  config: read(CONFIG_KEY, DEFAULT_TETRIS_CONFIG),
  bests: read<Record<string, TetrisBest>>(BESTS_KEY, {}),
  keys: read(KEYS_KEY, DEFAULT_TETRIS_KEYS),
  keysSync: 'local',
  keysUser: null,

  setConfig: (patch) => {
    const config = { ...get().config, ...patch }
    write(CONFIG_KEY, config)
    set({ config })
  },

  setKeys: (keys) => {
    write(KEYS_KEY, keys)
    set({ keys })
    const user = get().keysUser
    if (user === null) return
    set({ keysSync: 'saving' })
    void saveTetrisSettings(keys).then((result) => {
      // A newer change or another account has taken over since.
      if (get().keysUser !== user || get().keys !== keys) return
      set({ keysSync: result.success ? 'saved' : 'error' })
    })
  },

  syncKeys: async (userId) => {
    set({ keysUser: userId, keysSync: userId === null ? 'local' : 'loading' })
    if (userId === null) return
    const result = await getTetrisSettings()
    if (get().keysUser !== userId) return
    if (!result.success) {
      set({ keysSync: 'error' })
      return
    }
    if (result.data.keys) {
      write(KEYS_KEY, result.data.keys)
      set({ keys: result.data.keys, keysSync: 'saved' })
    } else {
      get().setKeys(get().keys)
    }
  },

  submitBest: (config, score, lines) => {
    const key = tetrisBestKey(config)
    if (score <= (get().bests[key]?.score ?? 0)) return false
    const bests = { ...get().bests, [key]: { score, lines } }
    write(BESTS_KEY, bests)
    set({ bests })
    return true
  },
}))
