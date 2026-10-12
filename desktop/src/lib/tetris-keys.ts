import { KEY_LABELS, MAX_KEYS_PER_ACTION, TETRIS_ACTIONS } from '@/constants/tetris'
import type { TetrisAction, TetrisKeyBindings } from '@/types/tetris'

/** Letters compare lower-case, so Shift or Caps Lock doesn't change what a key does. */
export const normalizeKey = (key: string) => (key.length === 1 ? key.toLowerCase() : key)

export const keyLabel = (key: string | undefined) => (key === undefined ? '—' : (KEY_LABELS[key] ?? key))

/** Which action each bound key triggers. */
export function actionsByKey(keys: TetrisKeyBindings): Map<string, TetrisAction> {
  const map = new Map<string, TetrisAction>()
  for (const { action } of TETRIS_ACTIONS) for (const key of keys[action] ?? []) map.set(key, action)
  return map
}

/**
 * Binds `key` to slot `slot` of `action`, taking it off whichever action had it, so one key never
 * does two things. A null key clears the slot.
 */
export function bindKey(keys: TetrisKeyBindings, action: TetrisAction, slot: number, key: string | null): TetrisKeyBindings {
  const next = Object.fromEntries(
    TETRIS_ACTIONS.map(({ action: a }) => [a, (keys[a] ?? []).filter((k) => k !== key)]),
  ) as TetrisKeyBindings
  const own = [...(keys[action] ?? [])].slice(0, MAX_KEYS_PER_ACTION)
  if (key === null) own.splice(slot, 1)
  else own[slot] = key
  next[action] = own.filter((k, i) => k !== undefined && own.indexOf(k) === i)
  return next
}

export const sameBindings = (a: TetrisKeyBindings, b: TetrisKeyBindings) =>
  TETRIS_ACTIONS.every(({ action }) => (a[action] ?? []).join('\n') === (b[action] ?? []).join('\n'))
