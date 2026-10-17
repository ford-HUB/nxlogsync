import { motion } from 'motion/react'
import { useState } from 'react'
import { DockGuides } from '@/components/dock/dock-guides'
import { DockLabel } from '@/components/dock/dock-label'
import { PewPewArt } from '@/components/aim-lab/ui/pew-pew-art'
import { useEdgeDock } from '@/hooks/use-edge-dock'
import { cn } from '@/lib/utils'

/**
 * Asks for the Typing test's spot below Run yourself's priority, so it steps aside to the nearest
 * free slot: directly above Run yourself.
 */
const AIM_LAB_DOCK = {
  storageKey: 'nxlogsync-aim-lab-dock',
  defaultDock: { side: 'right', t: 0.87 },
  priority: -3,
  gap: 14,
} as const

interface AimLabDockProps {
  onOpen: () => void
  /** Sits in the page flow (under the task list in a compact window) instead of on a window edge. */
  inline?: boolean
}

/**
 * PewPew, the aim trainer, docked on a window edge like Run yourself. Click to play; left-drag to move it
 * to another edge, snapping to an edge's middle when dropped near it.
 */
export function AimLabDock({ onOpen, inline = false }: AimLabDockProps) {
  const dock = useEdgeDock(AIM_LAB_DOCK)
  const [hovered, setHovered] = useState(false)
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
        aria-label="Open PewPew"
        title={inline ? 'Play PewPew' : 'Click to play · drag to move'}
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
        <motion.div whileHover={{ y: -2 }} className="size-14 drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]">
          {/* A light, square tile like Run yourself's, whatever the theme, with no outline. */}
          <div className="flex size-full items-center justify-center rounded-[0.6rem] bg-[#fafafa] [--pew-pew-ink:#171717] [--pew-pew-paper:#fafafa]">
            <span className="size-9">
              <PewPewArt burst={hovered && !moving} />
            </span>
          </div>
        </motion.div>
      </button>
      <DockLabel className={moving ? 'border bg-background text-foreground shadow-sm' : 'text-muted-foreground'}>
        {moving ? 'Move to an edge' : 'PewPew'}
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
