import { RotateCcw, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion, useAnimate } from 'motion/react'
import { forwardRef, useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { BinArt } from './bin-art'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatClock, fromDateKey } from '@/constants/time-format'
import { DockGuides } from '@/components/dock/dock-guides'
import { DockLabel } from '@/components/dock/dock-label'
import type { DockSide } from '@/types/dock'
import { useTrashDock } from '@/hooks/use-trash-dock'
import { cn } from '@/lib/utils'
import type { SetAsideEntry } from '@/store/trash-store'

interface TrashBinProps {
  /** A task is being dragged: the lid pops open. */
  ready: boolean
  /** The dragged task is in the drop zone: the lid opens wide. */
  over: boolean
  /** Bumped after each swallowed task; plays the gulp and the ring. */
  consumedCount: number
  items: SetAsideEntry[]
  onRestore: (item: SetAsideEntry) => void
  onDiscard: (item: SetAsideEntry) => void
  onEmpty: () => void
  /** A left press on a set-aside row; it may become a drag onto the day's list (`onStart` closes the list). */
  onPickItem: (item: SetAsideEntry, e: ReactPointerEvent, onStart: () => void) => void
  /** Sits in the page flow (under the task list in a compact window) instead of on a window edge. */
  inline?: boolean
}

const LID_ANGLE = { idle: 0, ready: -28, over: -62 }
const DAY_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})
/** The list opens away from the edge the bin sits on. */
const POPOVER_SIDE: Record<DockSide, 'top' | 'right' | 'bottom' | 'left'> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}
/** Gap kept between the open list and the window edges. */
const COLLISION_PADDING = 12

/**
 * The Trash, docked on a window edge (the middle of the right edge by default), where tasks are
 * set aside. Left-drag the bin to move it to another edge; it snaps to an edge's middle when
 * dropped near it; in a compact window it sits under the task list instead. Hit-testing happens
 * in useTrashDrag against the bin's rect; only the bin itself takes clicks (it opens the list).
 */
export const TrashBin = forwardRef<HTMLDivElement, TrashBinProps>(function TrashBin(
  { ready, over, consumedCount, items, onRestore, onDiscard, onEmpty, onPickItem, inline = false },
  ref,
) {
  const [scope, animateBin] = useAnimate<HTMLDivElement>()
  const filled = items.length > 0
  const lid = over ? LID_ANGLE.over : ready ? LID_ANGLE.ready : LID_ANGLE.idle

  // Gulp: squash down as the file lands, then spring back.
  useEffect(() => {
    if (consumedCount === 0) return
    void animateBin(
      scope.current,
      { scaleY: [1, 0.82, 1.08, 0.97, 1], scaleX: [1, 1.12, 0.95, 1.02, 1] },
      { duration: 0.55, ease: 'easeOut' },
    )
  }, [consumedCount, animateBin, scope])

  const [listOpen, setListOpen] = useState(false)
  const dock = useTrashDock(ready || inline)
  const moving = !inline && dock.moving

  const label = over ? 'Release to set aside' : ready ? 'Drop here to set aside' : moving ? 'Move to an edge' : 'Trash'

  const widget = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: ready || filled || moving ? 1 : 0.75,
        y: 0,
        scale: over ? 1.15 : ready || moving ? 1.06 : 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="flex flex-col items-center gap-0.5 select-none"
    >
      <Popover open={listOpen && !moving} onOpenChange={setListOpen}>
        <PopoverTrigger
          asChild
          onClick={(e) => {
            if (!inline && dock.consumeMoveClick()) e.preventDefault()
          }}
        >
          <button
            type="button"
            aria-label={`Trash, ${items.length} set aside`}
            title={inline ? 'Open the Trash' : 'Click to open · drag to move'}
            onPointerDown={inline ? undefined : dock.onPointerDown}
            className={cn(
              'pointer-events-auto relative touch-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
              moving ? 'cursor-grabbing' : 'cursor-pointer',
            )}
          >
            <div ref={ref} className="relative h-14 w-12">
              {/* Ring that ripples out once a file has been swallowed. */}
              <AnimatePresence>
                {consumedCount > 0 &&
                  [0, 1].map((i) => (
                    <motion.span
                      key={`${consumedCount}-${i}`}
                      initial={{ scale: 0.7, opacity: 0.7 }}
                      animate={{ scale: 1.9, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.75,
                        delay: 0.12 + i * 0.16,
                        ease: 'easeOut',
                      }}
                      className="absolute inset-0 rounded-full border-2 border-sky-500/60"
                    />
                  ))}
              </AnimatePresence>

              <motion.div
                animate={over ? { rotate: [0, -5, 5, -3, 0] } : { rotate: 0 }}
                transition={
                  over
                    ? {
                        duration: 0.45,
                        repeat: Infinity,
                        repeatDelay: 0.4,
                      }
                    : { duration: 0.2 }
                }
                className="absolute inset-0"
              >
                {/* Illustrated bin; the gulp squashes it from the wheels up. */}
                <div
                  ref={scope}
                  className={cn(
                    'absolute inset-0 origin-bottom transition-[filter] duration-200',
                    over
                      ? 'drop-shadow-[0_6px_10px_rgba(29,108,188,0.45)]'
                      : 'drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]',
                  )}
                >
                  <BinArt lid={lid} over={over} count={items.length} />
                </div>
              </motion.div>

              <AnimatePresence>
                {filled && (
                  <motion.span
                    key={items.length}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 18,
                    }}
                    className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-background px-1 text-[10px] leading-none font-semibold text-foreground tabular-nums ring-2 ring-foreground"
                  >
                    {items.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </button>
        </PopoverTrigger>

        {/* Kept inside the window: shifted along its side and shrunk to the room left there. */}
        <PopoverContent
          side={inline ? 'top' : POPOVER_SIDE[dock.dock.side]}
          align="center"
          collisionPadding={COLLISION_PADDING}
          sticky="always"
          className="max-h-(--radix-popover-content-available-height) w-80 max-w-(--radix-popover-content-available-width) gap-0 p-0"
        >
          <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
            <div>
              <p className="text-sm font-medium">Trash</p>
              <p className="text-[11px] text-muted-foreground">
                Drag a task onto a day's list to log it there, or restore it
              </p>
            </div>
            {filled && (
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-muted-foreground" onClick={onEmpty}>
                Empty
              </Button>
            )}
          </div>
          {filled ? (
            <ul className="flex max-h-72 min-h-0 flex-col overflow-y-auto p-1">
              {items.map((item) => (
                <li
                  key={`${item.entry.id}-${item.setAsideAt}`}
                  title="Drag onto the task list to log it on the open day"
                  onPointerDown={(e) => onPickItem(item, e, () => setListOpen(false))}
                  className="flex cursor-grab touch-none items-center gap-2 rounded-md px-2 py-1.5 select-none hover:bg-muted/60 active:cursor-grabbing"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {DAY_FORMAT.format(fromDateKey(item.date))} · {formatClock(item.entry.startMinutes)} –{' '}
                      {formatClock(item.entry.endMinutes)}
                    </span>
                    <span className="truncate text-[12px]">{item.entry.description}</span>
                  </span>
                  <Button variant="ghost" size="icon-sm" aria-label="Restore task" onClick={() => onRestore(item)}>
                    <RotateCcw />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Discard task"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDiscard(item)}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-1.5 px-6 py-8 text-center">
              <Trash2 className="size-5 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">Right-click and drag a task here to set it aside.</p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <DockLabel
        className={
          over
            ? 'bg-foreground text-background'
            : ready || moving
              ? 'border bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
        }
      >
        {label}
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
})
