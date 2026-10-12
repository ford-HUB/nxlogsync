import type { RoomMove } from '@/types/run-rooms'
import type { RunAction, RunMode, SkillKind } from '@/types/run-yourself'

/** Everything a Speed run key can do: the moves, and spending a skill. */
export type SpeedRunControl = RunAction | SkillKind

/** The keys bound to each control, per game; a key can mean different things in each game. */
export interface RunBindings {
  'speed-run': Record<SpeedRunControl, string[]>
  'pass-or-fall': Record<RoomMove, string[]>
}

export interface ControlRow {
  control: string
  label: string
  hint: string
}

/** Why a key can't go where it was pressed, checked before anything is saved. */
export type KeyConflict =
  | { kind: 'unbindable' }
  | { kind: 'reserved'; use: string }
  | { kind: 'duplicate' }
  | { kind: 'taken'; control: string }

/** Where a key is bound, in one game or the other. */
export interface KeyUse {
  mode: RunMode
  control: string
}
