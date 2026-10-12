import { SKILL_LABELS, SKILL_MAX_CHARGES } from '@/constants/run-yourself'
import { keyLabel } from '@/lib/run-controls'
import { cn } from '@/lib/utils'
import type { RunBindings } from '@/types/run-controls'
import type { RunAction, SkillKind } from '@/types/run-yourself'

const SKILL_ORDER: SkillKind[] = ['fire', 'slow', 'phase']
const MOVE_ORDER: RunAction[] = ['jump', 'slide', 'punch', 'kick']

const KBD = 'rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground'

/** A control's first two keys as key caps, then its name; laid out like Tetris's. */
export function KeyHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1">
        {keys.slice(0, 2).map((k) => (
          <kbd key={k} className={KBD}>
            {keyLabel(k)}
          </kbd>
        ))}
      </span>
      {label}
    </span>
  )
}

interface RunControlsProps {
  /** The player's Speed run keys. */
  keys: RunBindings['speed-run']
  /** Charges held, and real seconds left on each skill in use. */
  skills: Record<SkillKind, number>
  active: Record<SkillKind, number>
}

/**
 * Speed run's key hints for the footer, like Tetris's: the moves, then each skill with a dot per
 * charge (yellow while it runs, dim with none left), then restart. The footer adds esc.
 */
export function RunControls({ keys, skills, active }: RunControlsProps) {
  return (
    <>
      {MOVE_ORDER.map((move) => (
        <KeyHint key={move} keys={keys[move]} label={move} />
      ))}
      {SKILL_ORDER.map((skill) => {
        const running = active[skill] > 0
        return (
          <span
            key={skill}
            title={`${SKILL_LABELS[skill].name} — ${SKILL_LABELS[skill].hint}`}
            className={cn('flex items-center gap-2', running && 'text-score', !running && skills[skill] === 0 && 'opacity-50')}
          >
            <kbd className={cn(KBD, running && 'border-score/60 text-score')}>{keyLabel(keys[skill][0])}</kbd>
            {SKILL_LABELS[skill].name}
            <span className="flex gap-0.5">
              {Array.from({ length: SKILL_MAX_CHARGES }, (_, k) => (
                <span key={k} className={cn('size-1 rounded-full', k < skills[skill] ? 'bg-score' : 'bg-muted-foreground/30')} />
              ))}
            </span>
          </span>
        )
      })}
      <span className="flex items-center gap-2">
        <kbd className={KBD}>tab</kbd> restart
      </span>
    </>
  )
}
