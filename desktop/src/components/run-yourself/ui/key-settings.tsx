import { HeartCrack, Plus, RotateCcw, Timer, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { CONTROL_ROWS, DEFAULT_RUN_BINDINGS, MAX_KEYS_PER_CONTROL, RUN_MODE_LABELS } from '@/constants/run-controls'
import { bindKey, controlLabel, keyConflict, keyLabel, otherGameUse, swapKey, unbindKey } from '@/lib/run-controls'
import { cn } from '@/lib/utils'
import { useRunYourselfStore, type RunKeysSync } from '@/store/run-yourself-store'
import type { KeyConflict, KeyUse, RunBindings } from '@/types/run-controls'
import type { RunMode } from '@/types/run-yourself'

type Keys = Record<string, string[]>

/** The key slot waiting for a key press; a slot past the end adds a key. */
interface Target {
  mode: RunMode
  control: string
  slot: number
}

/** What the last key press did: refused with a conflict (and maybe a swap), or saved. */
interface Notice extends Target {
  key: string
  conflict: KeyConflict | null
  /** The keys after taking this key from its other control, when that leaves it one. */
  swap: Keys | null
  /** Saved, but also bound in the other game. */
  also: KeyUse | null
}

const MODE_ICONS: Record<RunMode, ReactNode> = {
  'speed-run': <Timer className="size-4" />,
  'pass-or-fall': <HeartCrack className="size-4" />,
}

const SYNC_LABELS: Record<RunKeysSync, string> = {
  local: 'Saved on this computer. Sign in to keep them on your account.',
  loading: 'Loading your keys…',
  saving: 'Saving to your account…',
  saved: 'Saved to your account.',
  error: "Couldn't save to your account; saved on this computer for now.",
}

const KBD = 'rounded-md border bg-background/60 px-1.5 py-0.5 text-[11px] text-foreground'

function sameKeys(a: Keys, b: Keys) {
  return Object.keys(a).every((c) => a[c].join('\u0000') === b[c]?.join('\u0000'))
}

function NoticeLine({ notice, onSwap }: { notice: Notice; onSwap: () => void }) {
  const key = <kbd className={KBD}>{keyLabel(notice.key)}</kbd>
  const { conflict, mode } = notice
  if (!conflict) {
    if (!notice.also) return null
    return (
      <p className="text-[11px] text-muted-foreground">
        Saved. {key} is also {controlLabel(notice.also.mode, notice.also.control)} in {RUN_MODE_LABELS[notice.also.mode]}; the
        games never run together, so that's fine.
      </p>
    )
  }
  return (
    <p role="alert" className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-destructive">
      {conflict.kind === 'unbindable' && <>That key can't be bound; press another, or esc to cancel.</>}
      {conflict.kind === 'reserved' && (
        <>
          {key} is kept for {conflict.use} in every game; press another.
        </>
      )}
      {conflict.kind === 'duplicate' && (
        <>
          {key} is already on {controlLabel(mode, notice.control)}; press another.
        </>
      )}
      {conflict.kind === 'taken' && (
        <>
          {key} is already {controlLabel(mode, conflict.control)} in {RUN_MODE_LABELS[mode]}.
          {notice.swap ? (
            <button
              type="button"
              onClick={onSwap}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-1.5 text-foreground underline-offset-2 hover:underline"
            >
              <kbd className={KBD}>enter</kbd> swap them
            </button>
          ) : (
            <> It's the only key {controlLabel(mode, conflict.control)} has, so give it another first.</>
          )}
        </>
      )}
    </p>
  )
}

interface GameKeysProps {
  mode: RunMode
  keys: Keys
  index: number
  target: Target | null
  notice: Notice | null
  onTarget: (target: Target | null) => void
  onRemove: (control: string, slot: number) => void
  onReset: () => void
  onSwap: () => void
}

/** One game's controls, a row each, with the keys bound to it; click a key to change it. */
function GameKeys({ mode, keys, index, target, notice, onTarget, onRemove, onReset, onSwap }: GameKeysProps) {
  const changed = !sameKeys(keys, DEFAULT_RUN_BINDINGS[mode] as Keys)
  return (
    <motion.section
      aria-label={`${RUN_MODE_LABELS[mode]} keys`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: 'easeOut' }}
      className="flex flex-col rounded-xl border bg-muted/40 px-5 pt-4 pb-2"
    >
      <header className="flex items-center justify-between gap-3 pb-2">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <span className="text-score">{MODE_ICONS[mode]}</span> {RUN_MODE_LABELS[mode]}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!changed}
          onClick={onReset}
          onMouseDown={(e) => e.preventDefault()}
          className="font-mono text-[11px] text-muted-foreground"
        >
          <RotateCcw /> reset
        </Button>
      </header>
      {CONTROL_ROWS[mode].map(({ control, label, hint }) => {
        const bound = keys[control]
        const here = (t: { mode: RunMode; control: string } | null) => t?.mode === mode && t.control === control
        const capturing = here(target) ? target!.slot : -1
        return (
          <div key={control} className="flex flex-col gap-1.5 border-t py-2.5 first-of-type:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col">
                <span className="text-[13px] text-foreground">{label}</span>
                <span className="truncate text-[11px] text-muted-foreground">{hint}</span>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                {bound.map((k, slot) => (
                  <span key={`${k}-${slot}`} className="group/key relative">
                    <button
                      type="button"
                      onClick={() => onTarget(capturing === slot ? null : { mode, control, slot })}
                      onMouseDown={(e) => e.preventDefault()}
                      aria-label={`Change ${label} key ${keyLabel(k)} in ${RUN_MODE_LABELS[mode]}`}
                      className={cn(
                        KBD,
                        'min-w-8 transition-colors hover:border-score/60',
                        capturing === slot && 'animate-pulse border-score text-score',
                      )}
                    >
                      {capturing === slot ? 'press a key' : keyLabel(k)}
                    </button>
                    {bound.length > 1 && capturing !== slot && (
                      <button
                        type="button"
                        onClick={() => onRemove(control, slot)}
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label={`Remove ${keyLabel(k)} from ${label}`}
                        className="absolute -top-1.5 -right-1.5 hidden size-3.5 items-center justify-center rounded-full border bg-background text-muted-foreground group-hover/key:flex hover:text-foreground"
                      >
                        <X className="size-2.5" />
                      </button>
                    )}
                  </span>
                ))}
                {capturing === bound.length ? (
                  <button
                    type="button"
                    onClick={() => onTarget(null)}
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(KBD, 'animate-pulse border-score text-score')}
                  >
                    press a key
                  </button>
                ) : (
                  bound.length < MAX_KEYS_PER_CONTROL && (
                    <button
                      type="button"
                      onClick={() => onTarget({ mode, control, slot: bound.length })}
                      onMouseDown={(e) => e.preventDefault()}
                      aria-label={`Add a key for ${label} in ${RUN_MODE_LABELS[mode]}`}
                      className="flex size-6 items-center justify-center rounded-md border border-dashed text-muted-foreground transition-colors hover:border-score/60 hover:text-foreground"
                    >
                      <Plus className="size-3" />
                    </button>
                  )
                )}
              </div>
            </div>
            {notice && here(notice) && <NoticeLine notice={notice} onSwap={onSwap} />}
          </div>
        )
      })}
    </motion.section>
  )
}

interface KeySettingsProps {
  onClose: () => void
}

/**
 * Run yourself's controls, per game: click a key (or +) and press the new one. Each press is checked
 * before it's saved: esc and tab stay reserved, and a key can't do two things in one game (it can
 * be swapped instead). The same key may mean different things in each game, and the settings say so.
 * Saved on this machine; esc cancels a change, or goes back to the games.
 */
export function KeySettings({ onClose }: KeySettingsProps) {
  const bindings = useRunYourselfStore((s) => s.bindings)
  const setBindings = useRunYourselfStore((s) => s.setBindings)
  const resetBindings = useRunYourselfStore((s) => s.resetBindings)
  const sync = useRunYourselfStore((s) => s.bindingsSync)
  const syncError = useRunYourselfStore((s) => s.bindingsError)
  const [target, setTarget] = useState<Target | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const save = (mode: RunMode, keys: Keys) => setBindings(mode, keys as RunBindings[typeof mode])
  const choose = (next: Target | null) => {
    setTarget(next)
    setNotice(null)
  }
  const swap = () => {
    if (!notice?.swap) return
    save(notice.mode, notice.swap)
    choose(null)
  }

  const onKeyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  onKeyRef.current = (e) => {
    e.preventDefault()
    if (e.repeat) return
    if (!target) {
      if (e.key === 'Escape') onClose()
      return
    }
    if (e.key === 'Escape') return choose(null)
    if (e.key === 'Enter' && notice?.swap) return swap()
    const keys = bindings[target.mode] as Keys
    const conflict = keyConflict(keys, target.control, e.key)
    if (conflict) {
      // Still listening: the next key press tries again.
      const swapped = conflict.kind === 'taken' ? swapKey(keys, target.control, target.slot, e.key) : null
      return setNotice({ ...target, key: e.key, conflict, swap: swapped, also: null })
    }
    save(target.mode, bindKey(keys, target.control, target.slot, e.key))
    setTarget(null)
    const also = otherGameUse(bindings, target.mode, e.key)
    setNotice(also ? { ...target, key: e.key, conflict: null, swap: null, also } : null)
  }

  // Ahead of the game's own key handling, which stands aside while this is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => onKeyRef.current(e)
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  return (
    <section aria-label="Controls" className="flex flex-col items-center gap-6 font-mono">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-[1.375rem] font-semibold text-foreground">Controls</h2>
        <p className="text-[12px] text-muted-foreground">Click a key, then press the new one</p>
        <p role="status" className={cn('text-[11px] text-muted-foreground', sync === 'error' && 'text-destructive')}>
          {SYNC_LABELS[sync]}
          {sync === 'error' && syncError && <> ({syncError})</>}
        </p>
      </div>
      <div className="flex w-full max-w-xl flex-col gap-4">
        {(['speed-run', 'pass-or-fall'] as const).map((mode, index) => (
          <GameKeys
            key={mode}
            mode={mode}
            keys={bindings[mode] as Keys}
            index={index}
            target={target}
            notice={notice}
            onTarget={choose}
            onRemove={(control, slot) => {
              save(mode, unbindKey(bindings[mode] as Keys, control, slot))
              choose(null)
            }}
            onReset={() => {
              resetBindings(mode)
              choose(null)
            }}
            onSwap={swap}
          />
        ))}
      </div>
    </section>
  )
}
