import { animate, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { LogEntry } from '@/types/daily-log'

/** idle → dragging → [confirming] → (consuming | returning) → idle */
export type TrashDragPhase = 'idle' | 'dragging' | 'confirming' | 'consuming' | 'returning'

/** Extra pixels around the bin that still count as "over" it, so the drop isn't fiddly. */
const TRASH_HIT_SLOP = 40
const RIGHT_BUTTON = 2

/** The task list border the drop zone starts at: the side the bin is docked on, if beside the list. */
export interface TrashZoneEdge {
  side: 'left' | 'right'
  /** The border's x in viewport px. */
  x: number
}

function zoneEdgeOf(list: HTMLElement | null, bin: HTMLElement | null): TrashZoneEdge | null {
  const zone = list?.getBoundingClientRect()
  const rect = bin?.getBoundingClientRect()
  if (!zone || !rect) return null
  const binX = rect.left + rect.width / 2
  if (binX >= zone.right) return { side: 'right', x: zone.right }
  if (binX <= zone.left) return { side: 'left', x: zone.left }
  // Docked above or below the list: only the bin itself is the drop zone.
  return null
}

/**
 * Right-click-and-drag a task into the Trash to set it aside. The drop zone is the bin plus,
 * when the bin is docked beside the list, everything past the list's border on that side, so the
 * file only has to leave the list sideways.
 * The dragged "file" follows the pointer through motion values (no re-render per mousemove);
 * releasing in the zone plays the swallow animation and only then hands the entry to `onDrop`,
 * releasing elsewhere flies it back. When `needsConfirm` says so, a release in the zone holds the
 * file there (phase `confirming`) until `confirm` swallows it or `cancel` flies it back.
 */
export function useTrashDrag(onDrop: (entry: LogEntry) => void, needsConfirm?: () => boolean) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const opacity = useMotionValue(1)
  const spin = useMotionValue(0)

  const trashRef = useRef<HTMLDivElement>(null)
  /** The task list container; its border on the bin's side is where the drop zone starts. */
  const zoneRef = useRef<HTMLDivElement>(null)
  // Measured when a drag starts (for the zone's highlight).
  const [zoneEdge, setZoneEdge] = useState<TrashZoneEdge | null>(null)
  const originRef = useRef({ x: 0, y: 0 })
  const [entry, setEntry] = useState<LogEntry | null>(null)
  const [phase, setPhase] = useState<TrashDragPhase>('idle')
  const [overTrash, setOverTrash] = useState(false)
  // Bumped after each swallow; the bin keys its gulp + ring animation off it.
  const [consumedCount, setConsumedCount] = useState(0)

  const isOverTrash = useCallback((px: number, py: number) => {
    const rect = trashRef.current?.getBoundingClientRect()
    if (!rect) return false
    const edge = zoneEdgeOf(zoneRef.current, trashRef.current)
    if (edge?.side === 'right' && px >= edge.x) return true
    if (edge?.side === 'left' && px <= edge.x) return true
    return (
      px >= rect.left - TRASH_HIT_SLOP &&
      px <= rect.right + TRASH_HIT_SLOP &&
      py >= rect.top - TRASH_HIT_SLOP &&
      py <= rect.bottom + TRASH_HIT_SLOP
    )
  }, [])

  const grab = useCallback(
    (picked: LogEntry, px: number, py: number) => {
      if (phase !== 'idle') return
      originRef.current = { x: px, y: py }
      x.set(px)
      y.set(py)
      spin.set(0)
      opacity.set(1)
      scale.set(0.6)
      void animate(scale, 1, { type: 'spring', stiffness: 500, damping: 24 })
      setEntry(picked)
      setZoneEdge(zoneEdgeOf(zoneRef.current, trashRef.current))
      setOverTrash(false)
      setPhase('dragging')
    },
    [phase, x, y, spin, opacity, scale],
  )

  const reset = useCallback(() => {
    setEntry(null)
    setOverTrash(false)
    setPhase('idle')
  }, [])

  const flyBack = useCallback(() => {
    setPhase('returning')
    const { x: ox, y: oy } = originRef.current
    const transition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const }
    void Promise.all([
      animate(x, ox, transition),
      animate(y, oy, transition),
      animate(scale, 0.5, transition),
      animate(opacity, 0, transition),
    ]).then(reset)
  }, [x, y, scale, opacity, reset])

  const swallow = useCallback(
    (dropped: LogEntry) => {
      const rect = trashRef.current!.getBoundingClientRect()
      const mouthX = rect.left + rect.width / 2
      const mouthY = rect.top + rect.height * 0.32
      setPhase('consuming')
      const duration = 0.5
      // Hop up over the rim, then drop in while shrinking and tumbling.
      void Promise.all([
        animate(x, mouthX, { duration, ease: [0.3, 0, 0.2, 1] }),
        animate(y, [y.get(), mouthY - 46, mouthY + 14], {
          duration,
          times: [0, 0.5, 1],
          ease: 'easeInOut',
        }),
        animate(scale, [scale.get(), 0.75, 0.12], {
          duration,
          times: [0, 0.5, 1],
        }),
        animate(spin, [0, -12, 70], { duration, times: [0, 0.5, 1] }),
        animate(opacity, [1, 1, 0], { duration, times: [0, 0.85, 1] }),
      ]).then(() => {
        onDrop(dropped)
        setConsumedCount((n) => n + 1)
        reset()
      })
    },
    [x, y, scale, spin, opacity, onDrop, reset],
  )

  const confirm = useCallback(() => {
    if (phase === 'confirming' && entry) swallow(entry)
  }, [phase, entry, swallow])

  const cancel = useCallback(() => {
    if (phase === 'confirming') flyBack()
  }, [phase, flyBack])

  useEffect(() => {
    if (phase !== 'dragging' || !entry) return

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setOverTrash(isOverTrash(e.clientX, e.clientY))
    }
    const onUp = (e: MouseEvent) => {
      if (e.button !== RIGHT_BUTTON) return
      if (!isOverTrash(e.clientX, e.clientY)) flyBack()
      else if (needsConfirm?.()) setPhase('confirming')
      else swallow(entry)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') flyBack()
    }
    // The right-button release opens a context menu wherever the pointer ends up.
    const blockMenu = (e: MouseEvent) => e.preventDefault()

    const previousSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('keydown', onKey)
    window.addEventListener('contextmenu', blockMenu, true)
    return () => {
      document.body.style.userSelect = previousSelect
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('keydown', onKey)
      // contextmenu fires just after mouseup, so let it through the blocker first.
      setTimeout(() => window.removeEventListener('contextmenu', blockMenu, true), 0)
    }
  }, [phase, entry, x, y, isOverTrash, needsConfirm, flyBack, swallow])

  return {
    trashRef,
    zoneRef,
    zoneEdge,
    entry,
    phase,
    overTrash,
    consumedCount,
    grab,
    confirm,
    cancel,
    motion: { x, y, scale, opacity, spin },
  }
}
