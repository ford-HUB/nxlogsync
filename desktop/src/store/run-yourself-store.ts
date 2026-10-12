import { create } from 'zustand'
import { DEFAULT_RUN_BINDINGS } from '@/constants/run-controls'
import { DEFAULT_RUN_CONFIG } from '@/constants/run-yourself'
import { mergeBindings } from '@/lib/run-controls'
import { runBestKey } from '@/lib/run-engine'
import { getRunSettings, saveRunSettings } from '@/services/run-yourself-service'
import type { RunBindings } from '@/types/run-controls'
import type { RunConfig, RunMode } from '@/types/run-yourself'

const CONFIG_KEY = 'nxlogsync-run-yourself-config'
const BESTS_KEY = 'nxlogsync-run-yourself-bests'
const BINDINGS_KEY = 'nxlogsync-run-yourself-keys'

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

export interface RunBest {
  points: number
  metres: number
  seconds: number
  /** Pass or fall: levels got through. */
  levels?: number
}

/** Where the keys are kept: only on this machine (signed out), or on the account. */
export type RunKeysSync = 'local' | 'loading' | 'saving' | 'saved' | 'error'

interface RunYourselfState {
  config: RunConfig
  /** Best run per runBestKey, on this machine only (there is no server board yet). */
  bests: Record<string, RunBest>
  /** The player's keys per game, on this machine. */
  bindings: RunBindings
  bindingsSync: RunKeysSync
  /** The server's reason when the last load or save failed. */
  bindingsError: string | null
  /** The account the keys sync with; null when signed out. */
  bindingsUser: string | null
  setConfig: (patch: Partial<RunConfig>) => void
  /**
   * Saves one game's keys on this machine, and on the account when signed in; they're checked for
   * conflicts before they get here.
   */
  setBindings: <M extends RunMode>(mode: M, keys: RunBindings[M]) => void
  resetBindings: (mode: RunMode) => void
  /** Keeps every game's keys here, then on the account when signed in. */
  saveAll: (bindings: RunBindings) => void
  /**
   * Follows the signed-in account: its saved keys replace this machine's; an account without any
   * takes this machine's. Null (signed out) keeps them local only.
   */
  syncBindings: (userId: string | null) => Promise<void>
  /** Records the run when it beats the best for that board; true when it did. */
  submitBest: (config: RunConfig, best: RunBest) => boolean
}

export const useRunYourselfStore = create<RunYourselfState>((set, get) => ({
  config: read(CONFIG_KEY, DEFAULT_RUN_CONFIG),
  bests: read<Record<string, RunBest>>(BESTS_KEY, {}),
  bindings: mergeBindings(read<Record<string, unknown>>(BINDINGS_KEY, {})),
  bindingsSync: 'local',
  bindingsError: null,
  bindingsUser: null,

  setConfig: (patch) => {
    const config = { ...get().config, ...patch }
    write(CONFIG_KEY, config)
    set({ config })
  },

  setBindings: (mode, keys) => get().saveAll({ ...get().bindings, [mode]: keys }),

  resetBindings: (mode) => get().setBindings(mode, structuredClone(DEFAULT_RUN_BINDINGS[mode])),

  saveAll: (bindings) => {
    write(BINDINGS_KEY, bindings)
    set({ bindings, bindingsError: null })
    const user = get().bindingsUser
    if (user === null) return
    set({ bindingsSync: 'saving' })
    void saveRunSettings(bindings).then((result) => {
      // A newer change or another account has taken over since.
      if (get().bindingsUser !== user || get().bindings !== bindings) return
      if (result.success) set({ bindingsSync: 'saved' })
      else set({ bindingsSync: 'error', bindingsError: result.message })
    })
  },

  syncBindings: async (userId) => {
    set({ bindingsUser: userId, bindingsSync: userId === null ? 'local' : 'loading', bindingsError: null })
    if (userId === null) return
    const result = await getRunSettings()
    if (get().bindingsUser !== userId) return
    if (!result.success) {
      set({ bindingsSync: 'error', bindingsError: result.message })
      return
    }
    if (result.data.keys) {
      const bindings = mergeBindings(result.data.keys)
      write(BINDINGS_KEY, bindings)
      set({ bindings, bindingsSync: 'saved' })
    } else {
      get().saveAll(get().bindings)
    }
  },

  submitBest: (config, best) => {
    const key = runBestKey(config)
    if (best.points <= (get().bests[key]?.points ?? 0)) return false
    const bests = { ...get().bests, [key]: best }
    write(BESTS_KEY, bests)
    set({ bests })
    return true
  },
}))
