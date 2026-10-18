import type { AimLabPhase } from '@/types/aim-lab'

interface AimLabKeyHintsProps {
  phase: AimLabPhase
}

/** The controls for where the round is, centred along the bottom like the other games. */
export function AimLabKeyHints({ phase }: AimLabKeyHintsProps) {
  const hints: [string, string][] =
    phase === 'running' || phase === 'armed'
      ? [
          ['click', 'shoot'],
          ['tab', 'restart'],
          ['esc', 'pause'],
        ]
      : phase === 'paused'
        ? [
            ['tab', 'restart'],
            ['esc', 'exit round'],
          ]
        : [
            ['tab', 'start'],
            ['esc', 'close'],
          ]

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-6 font-mono text-[12px] text-white/70">
      {hints.map(([key, label]) => (
        <span key={label} className="flex items-center gap-2">
          <kbd className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-white">{key}</kbd> {label}
        </span>
      ))}
    </footer>
  )
}
