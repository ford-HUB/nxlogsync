import type { CSSProperties } from 'react'
import { DailyLog } from '@/components/daily-log/daily-log'
import { useCompactWindow } from '@/hooks/use-compact-window'
import { DOCK_LANE } from '@/hooks/use-edge-dock'
import { useDockStore } from '@/store/dock-store'

interface DailyLogPageProps {
  onOpenSettings: () => void
  onOpenTypingTest: () => void
  onOpenTetris: () => void
  onOpenRunYourself: () => void
  onOpenAimLab: () => void
}

/**
 * Keeps the page clear of a widget docked on the top or bottom edge, so the first and last cards
 * can scroll out from under it. Side edges need nothing: widgets dock only when the margin beside
 * the content column holds them, and sit under the task list otherwise.
 */
function useDockLanes(): CSSProperties {
  const compact = useCompactWindow()
  const widgets = useDockStore((s) => s.widgets)
  if (compact) return {}
  const sides = new Set(Object.values(widgets).map((w) => w.dock.side))
  return {
    paddingTop: sides.has('top') ? DOCK_LANE.y : undefined,
    paddingBottom: sides.has('bottom') ? DOCK_LANE.y : undefined,
  }
}

export function DailyLogPage({ onOpenSettings, onOpenTypingTest, onOpenTetris, onOpenRunYourself, onOpenAimLab }: DailyLogPageProps) {
  const lanes = useDockLanes()
  return (
    <main style={lanes} className="min-h-dvh bg-muted/40 lg:h-dvh lg:overflow-y-auto">
      <DailyLog
        onOpenSettings={onOpenSettings}
        onOpenTypingTest={onOpenTypingTest}
        onOpenTetris={onOpenTetris}
        onOpenRunYourself={onOpenRunYourself}
        onOpenAimLab={onOpenAimLab}
      />
    </main>
  )
}
