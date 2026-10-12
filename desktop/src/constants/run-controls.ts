import type { ControlRow, RunBindings } from '@/types/run-controls'
import type { RunMode } from '@/types/run-yourself'

/** Each game's keys until the player changes them; the footer shows the first two of each. */
export const DEFAULT_RUN_BINDINGS: RunBindings = {
  'speed-run': {
    jump: [' ', 'ArrowUp', 'w'],
    slide: ['ArrowDown', 's'],
    punch: ['j'],
    kick: ['k'],
    fire: ['1'],
    slow: ['2'],
    phase: ['3'],
  },
  'pass-or-fall': {
    left: ['ArrowLeft', 'a'],
    right: ['ArrowRight', 'd'],
    jump: [' ', 'ArrowUp', 'w'],
  },
}

/** A control holds this many keys at most, and always at least one. */
export const MAX_KEYS_PER_CONTROL = 3

/** Keys every game already uses, so none can be bound. */
export const RESERVED_KEYS: Record<string, string> = { Escape: 'close', Tab: 'restart' }

/** Keys the window can't tell apart or never sees cleanly. */
export const UNBINDABLE_KEYS = new Set(['Meta', 'OS', 'Dead', 'Unidentified', 'Process', 'ContextMenu', 'Fn', 'FnLock'])

/** The settings rows per game, in the order shown. */
export const CONTROL_ROWS: Record<RunMode, ControlRow[]> = {
  'speed-run': [
    { control: 'jump', label: 'jump', hint: 'Clear the rocks' },
    { control: 'slide', label: 'slide', hint: 'Under the blocks; sweeps an enemy' },
    { control: 'punch', label: 'punch', hint: 'Quick, short reach' },
    { control: 'kick', label: 'kick', hint: 'Slower, longer reach' },
    { control: 'fire', label: 'fire fists', hint: 'Spend a fire fists charge' },
    { control: 'slow', label: 'slow-mo', hint: 'Spend a slow-mo charge' },
    { control: 'phase', label: 'phase', hint: 'Spend a phase charge' },
  ],
  'pass-or-fall': [
    { control: 'left', label: 'left', hint: 'Walk left while held' },
    { control: 'right', label: 'right', hint: 'Walk right while held' },
    { control: 'jump', label: 'jump', hint: 'Up onto the blocks' },
  ],
}

export const RUN_MODE_LABELS: Record<RunMode, string> = { 'speed-run': 'Speed run', 'pass-or-fall': 'Pass or fall' }

/** How keys read on a key cap. */
export const KEY_LABELS: Record<string, string> = {
  ' ': 'space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'esc',
  Control: 'ctrl',
  Backspace: 'bksp',
  CapsLock: 'caps',
}
