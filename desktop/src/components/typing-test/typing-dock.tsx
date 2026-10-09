import { motion } from 'motion/react'
import { useState } from 'react'
import { DockGuides } from '@/components/dock/dock-guides'
import { useEdgeDock } from '@/hooks/use-edge-dock'
import { cn } from '@/lib/utils'
import { bestKey, useTypingTestStore } from '@/store/typing-test-store'
import { KeyboardArt } from './ui/keyboard-art'

/** Above the Trash on the right edge until the user moves it. */
const TYPING_DOCK = { storageKey: 'nxlogsync-typing-dock', defaultDock: { side: 'right', t: 0.87 } } as const

interface TypingDockProps {
  onOpen: () => void
}

/**
 * The Typing test, docked on a window edge like the Trash. Click to open the test; left-drag to
 * move it to another edge, snapping to an edge's middle when dropped near it.
 */
export function TypingDock({ onOpen }: TypingDockProps) {
  const dock = useEdgeDock(TYPING_DOCK)
  const [hovered, setHovered] = useState(false)
  const best = useTypingTestStore((s) => s.bests[bestKey(s.config)])

  return (
    <>
      {dock.moving && <DockGuides landing={dock.landing} />}

      <motion.div style={{ x: dock.x, y: dock.y }} className="pointer-events-none fixed top-0 left-0 z-40 size-0">
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: hovered || dock.moving ? 1 : 0.75, y: 0, scale: dock.moving ? 1.06 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="flex flex-col items-center gap-0.5 select-none"
          >
            <button
              type="button"
              aria-label="Open typing test"
              title="Click to open · drag to move"
              onPointerDown={dock.onPointerDown}
              onPointerEnter={() => setHovered(true)}
              onPointerLeave={() => setHovered(false)}
              onClick={() => {
                if (!dock.consumeMoveClick()) onOpen()
              }}
              className={cn(
                'pointer-events-auto relative touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
                dock.moving ? 'cursor-grabbing' : 'cursor-pointer',
              )}
            >
              <motion.div
                whileHover={{ y: -2 }}
                className="h-10 w-[4.5rem] drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
              >
                <KeyboardArt typing={hovered && !dock.moving} />
              </motion.div>
              {best !== undefined && (
                <span className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-background px-1 text-[10px] leading-none font-semibold text-score tabular-nums ring-2 ring-foreground">
                  {Math.round(best)}
                </span>
              )}
            </button>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap transition-colors',
                dock.moving ? 'border bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {dock.moving ? 'Move to an edge' : 'Typing test'}
            </span>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}
