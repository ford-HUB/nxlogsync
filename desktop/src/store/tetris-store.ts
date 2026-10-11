import { create } from 'zustand'
import { DEFAULT_TETRIS_CONFIG } from '@/constants/tetris'
import type { TetrisConfig } from '@/types/tetris'

const CONFIG_KEY = 'nxlogsync-tetris-config'
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

interface TetrisState {
  config: TetrisConfig
  /** Best game per tetrisBestKey. */
  bests: Record<string, TetrisBest>
  setConfig: (patch: Partial<TetrisConfig>) => void
  /** Records the game when it beats the best for that start level; true when it did. */
  submitBest: (config: TetrisConfig, score: number, lines: number) => boolean
}

export const useTetrisStore = create<TetrisState>((set, get) => ({
  config: read(CONFIG_KEY, DEFAULT_TETRIS_CONFIG),
  bests: read<Record<string, TetrisBest>>(BESTS_KEY, {}),

  setConfig: (patch) => {
    const config = { ...get().config, ...patch }
    write(CONFIG_KEY, config)
    set({ config })
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
