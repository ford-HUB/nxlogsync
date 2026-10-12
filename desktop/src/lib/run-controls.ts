import { CONTROL_ROWS, DEFAULT_RUN_BINDINGS, KEY_LABELS, RESERVED_KEYS, UNBINDABLE_KEYS } from '@/constants/run-controls'
import type { KeyConflict, KeyUse, RunBindings } from '@/types/run-controls'
import type { RunMode } from '@/types/run-yourself'

type Keys = Record<string, string[]>

/** Letters match whatever the case (shift or caps lock held); everything else by name. */
export function normalizeKey(key: string): string {
  return key.length === 1 ? key.toLowerCase() : key
}

export function keyLabel(key: string): string {
  return KEY_LABELS[key] ?? key.toLowerCase()
}

/** The control a key is bound to in one game, if any. */
export function controlForKey<C extends string>(keys: Record<C, string[]>, key: string): C | undefined {
  const k = normalizeKey(key)
  return (Object.keys(keys) as C[]).find((c) => keys[c].includes(k))
}

export function controlLabel(mode: RunMode, control: string): string {
  return CONTROL_ROWS[mode].find((r) => r.control === control)?.label ?? control
}

/**
 * Checks a key before it's bound to `control` in one game: it must reach the page, not be one
 * every game already uses, and not be bound to another control in the same game.
 */
export function keyConflict(keys: Keys, control: string, key: string): KeyConflict | null {
  if (UNBINDABLE_KEYS.has(key)) return { kind: 'unbindable' }
  if (RESERVED_KEYS[key]) return { kind: 'reserved', use: RESERVED_KEYS[key] }
  const k = normalizeKey(key)
  const owner = controlForKey(keys, k)
  if (owner === control) return { kind: 'duplicate' }
  if (owner) return { kind: 'taken', control: owner }
  return null
}

/** The key in `slot` (or a new one, at the end) set to `key`; check keyConflict first. */
export function bindKey(keys: Keys, control: string, slot: number, key: string): Keys {
  const next = [...keys[control]]
  next[slot] = normalizeKey(key)
  return { ...keys, [control]: next }
}

/**
 * Takes a key from the control it's on: that control gets the key this slot had, or just loses it
 * when this slot was new. Null when that would leave it with no key.
 */
export function swapKey(keys: Keys, control: string, slot: number, key: string): Keys | null {
  const k = normalizeKey(key)
  const owner = controlForKey(keys, k)
  if (!owner) return bindKey(keys, control, slot, k)
  const previous = keys[control][slot]
  const ownerKeys = previous ? keys[owner].map((x) => (x === k ? previous : x)) : keys[owner].filter((x) => x !== k)
  if (!ownerKeys.length) return null
  return { ...bindKey(keys, control, slot, k), [owner]: ownerKeys }
}

export function unbindKey(keys: Keys, control: string, slot: number): Keys {
  if (keys[control].length <= 1) return keys
  return { ...keys, [control]: keys[control].filter((_, i) => i !== slot) }
}

/** Where a key is bound in the other game, so the settings can say so. */
export function otherGameUse(bindings: RunBindings, mode: RunMode, key: string): KeyUse | null {
  const other: RunMode = mode === 'speed-run' ? 'pass-or-fall' : 'speed-run'
  const control = controlForKey<string>(bindings[other], key)
  return control ? { mode: other, control } : null
}

/** Saved bindings over the defaults, keeping only controls that still exist with at least one key. */
export function mergeBindings(saved: unknown): RunBindings {
  const merged = structuredClone(DEFAULT_RUN_BINDINGS)
  if (!saved || typeof saved !== 'object') return merged
  for (const mode of Object.keys(merged) as RunMode[]) {
    const game = (saved as Record<string, unknown>)[mode]
    if (!game || typeof game !== 'object') continue
    const target = merged[mode] as Keys
    for (const control of Object.keys(target)) {
      const keys = (game as Record<string, unknown>)[control]
      if (Array.isArray(keys) && keys.length && keys.every((k) => typeof k === 'string')) target[control] = keys
    }
  }
  return merged
}
