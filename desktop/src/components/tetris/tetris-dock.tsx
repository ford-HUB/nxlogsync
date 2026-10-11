import { motion } from 'motion/react'
import { useState } from 'react'
import { DockGuides } from '@/components/dock/dock-guides'
import { DockLabel } from '@/components/dock/dock-label'
import { useEdgeDock } from '@/hooks/use-edge-dock'
import { cn } from '@/lib/utils'
import { useTetrisStore } from '@/store/tetris-store'
import { TetrisArt } from './ui/tetris-art'

/**
 * Asks for the Typing test's spot with the lowest priority, so it steps aside to the nearest free
 * slot: directly above the Typing test (the Trash holds the one below), whatever the window height.
 */
const TETRIS_DOCK = {
  storageKey: 'nxlogsync-tetris-dock',
  defaultDock: { side: 'right', t: 0.87 },
  priority: -1,
} as const

/** Short enough for the badge: 950, 12.4k, 1.2m. */
function formatPeak(score: number) {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  if (score >= 10_000) return `${(score / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(score)
}

interface TetrisDockProps {
  onOpen: () => void
  /** Sits in the page flow (under the task list in a compact window) instead of on a window edge. */
  inline?: boolean
}

/**
 * Tetris, docked on a window edge like the Typing test. Click to play; left-drag to move it to
 * another edge, snapping to an edge's middle when dropped near it.
 */
export function TetrisDock({ onOpen, inline = false }: TetrisDockProps) {
  const dock = useEdgeDock(TETRIS_DOCK)
  const [hovered, setHovered] = useState(false)
  // The peak score across every start level; 0 until the first game.
  const peak = useTetrisStore((s) => Math.max(0, ...Object.values(s.bests).map((b) => b.score)))
  const moving = !inline && dock.moving

  const widget = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: hovered || moving ? 1 : 0.75,
        y: 0,
        scale: moving ? 1.06 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="flex flex-col items-center gap-0.5 select-none"
    >
      <button
        type="button"
        aria-label="Open Tetris"
        title={inline ? 'Play Tetris' : 'Click to play · drag to move'}
        onPointerDown={inline ? undefined : dock.onPointerDown}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => {
          if (inline || !dock.consumeMoveClick()) onOpen()
        }}
        className={cn(
          'pointer-events-auto relative touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
          moving ? 'cursor-grabbing' : 'cursor-pointer',
        )}
      >
        <motion.div whileHover={{ y: -2 }} className="h-14 w-10 drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]">
          <TetrisArt dropping={hovered && !moving} />
        </motion.div>
        <span
          title={`Peak score: ${peak.toLocaleString()}`}
          className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-background px-1 text-[10px] leading-none font-semibold text-score tabular-nums ring-2 ring-foreground"
        >
          {formatPeak(peak)}
        </span>
      </button>
      <DockLabel className={moving ? 'border bg-background text-foreground shadow-sm' : 'text-muted-foreground'}>
        {moving ? 'Move to an edge' : 'Tetris'}
      </DockLabel>
    </motion.div>
  )

  if (inline) return widget

  return (
    <>
      {dock.moving && <DockGuides landing={dock.landing} />}

      <motion.div style={{ x: dock.x, y: dock.y }} className="pointer-events-none fixed top-0 left-0 z-40 size-0">
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">{widget}</div>
      </motion.div>
    </>
  )
}
