import { motion } from 'motion/react'
import { type DockSide, type EdgeDock, dockPoint } from '@/hooks/use-edge-dock'
import { cn } from '@/lib/utils'

const EDGE_MIDDLES: DockSide[] = ['top', 'right', 'bottom', 'left']

interface DockGuidesProps {
  /** Where the widget would land if released now. */
  landing: EdgeDock | null
}

/** While a docked widget is moving: the middle of each edge, lit when releasing would snap there. */
export function DockGuides({ landing }: DockGuidesProps) {
  return EDGE_MIDDLES.map((side) => {
    const p = dockPoint({ side, t: 0.5 })
    const active = landing?.side === side && landing.t === 0.5
    return (
      <motion.span
        key={side}
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: active ? 1 : 0.5, scale: active ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        style={{ left: p.x, top: p.y }}
        className={cn(
          'pointer-events-none fixed z-30 -mt-7 -ml-7 size-14 rounded-full border-2 border-dashed',
          active ? 'border-foreground bg-foreground/10' : 'border-muted-foreground/40',
        )}
      />
    )
  })
}
