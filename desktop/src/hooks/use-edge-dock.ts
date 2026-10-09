import { animate, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useDockStore } from '@/store/dock-store'
import type { DockSide, EdgeDock } from '@/types/dock'

export type { DockSide, EdgeDock } from '@/types/dock'

const SIDES: DockSide[] = ['top', 'right', 'bottom', 'left']

/** Half a docked widget's footprint (icon + its widest label), so nothing pokes past the window edge. */
const HALF_W = 64
const HALF_H = 34
const EDGE_GAP = 8
/** Released this close to an edge's middle, the widget centres itself on that edge. */
const SNAP_DISTANCE = 90
/** Pointer travel before a press counts as a move rather than a click. */
const DRAG_THRESHOLD = 4
const SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** The strip along each edge a docked widget takes up, in px; the page keeps clear of it. */
export const DOCK_LANE = { x: 2 * (HALF_W + EDGE_GAP), y: 2 * (HALF_H + EDGE_GAP) }

function readDock(storageKey: string, fallback: EdgeDock): EdgeDock {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (SIDES.includes(saved?.side) && typeof saved.t === 'number') return { side: saved.side, t: clamp(saved.t, 0, 1) }
  } catch {
    // Storage unavailable or corrupt; use the default spot.
  }
  return fallback
}

function writeDock(storageKey: string, dock: EdgeDock) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(dock))
  } catch {
    // Not persisted; the widget goes back to its default spot next launch.
  }
}

/** Whether `a` is placed ahead of `b` when both want the same stretch of an edge. */
const outranks = (a: { key: string; priority: number }, b: { key: string; priority: number }) =>
  a.priority > b.priority || (a.priority === b.priority && a.key < b.key)

/**
 * The widget's centre, in viewport px, for a dock in the current window. Given the widget's key,
 * it steps aside from higher-priority widgets on the same edge rather than overlapping them.
 */
export function dockPoint({ side, t }: EdgeDock, key?: string) {
  const w = window.innerWidth
  const h = window.innerHeight
  const horizontal = side === 'top' || side === 'bottom'
  const half = horizontal ? HALF_W : HALF_H
  const length = horizontal ? w : h
  const min = EDGE_GAP + half
  const max = Math.max(min, length - EDGE_GAP - half)
  let along = clamp(t * length, min, max)

  if (key) {
    const widgets = useDockStore.getState().widgets
    const self = { key, priority: widgets[key]?.priority ?? 0 }
    const blockers = Object.entries(widgets)
      .filter(([k, wd]) => k !== key && wd.dock.side === side && outranks({ key: k, priority: wd.priority }, self))
      .map(([k, wd]) => {
        const p = dockPoint(wd.dock, k)
        return horizontal ? p.x : p.y
      })
    const spacing = 2 * half + EDGE_GAP
    const clear = (pos: number) => blockers.every((b) => Math.abs(pos - b) >= spacing)
    if (!clear(along)) {
      // The free spot nearest the one asked for, just past a blocker on either side.
      const options = blockers
        .flatMap((b) => [b - spacing, b + spacing])
        .filter((pos) => pos >= min && pos <= max && clear(pos))
        .sort((a, b) => Math.abs(a - along) - Math.abs(b - along))
      if (options.length > 0) along = options[0]
    }
  }

  switch (side) {
    case 'top':
      return { x: along, y: EDGE_GAP + HALF_H }
    case 'bottom':
      return { x: along, y: h - EDGE_GAP - HALF_H }
    case 'left':
      return { x: EDGE_GAP + HALF_W, y: along }
    case 'right':
      return { x: w - EDGE_GAP - HALF_W, y: along }
  }
}

/** The dock for a widget centred at (x, y): its nearest edge, centred on it when close to the middle. */
function nearestDock(x: number, y: number): EdgeDock {
  const w = window.innerWidth
  const h = window.innerHeight
  const gaps: Record<DockSide, number> = { top: y - HALF_H, right: w - x - HALF_W, bottom: h - y - HALF_H, left: x - HALF_W }
  const side = SIDES.reduce((best, s) => (gaps[s] < gaps[best] ? s : best))
  const horizontal = side === 'top' || side === 'bottom'
  const pos = horizontal ? x : y
  const length = horizontal ? w : h
  return { side, t: Math.abs(pos - length / 2) <= SNAP_DISTANCE ? 0.5 : pos / length }
}

const sameDock = (a: EdgeDock | null, b: EdgeDock | null) => a?.side === b?.side && a?.t === b?.t

interface EdgeDockOptions {
  /** localStorage key the spot is remembered under; also names the widget among the docked ones. */
  storageKey: string
  defaultDock: EdgeDock
  /** On a shared edge the lower priority widget steps aside (default 0). */
  priority?: number
  /** Ignores presses (e.g. while something is being dragged onto the widget). */
  disabled?: boolean
}

/**
 * Lets a docked widget (the Trash, the Typing test) be moved with a left-button drag. It always
 * lands on the nearest window edge, snapping to that edge's middle when released near it, and
 * never on top of another docked widget. The spot is remembered across launches and kept on its
 * edge when the window resizes.
 */
export function useEdgeDock({ storageKey, defaultDock, priority = 0, disabled = false }: EdgeDockOptions) {
  const [dock, setDock] = useState(() => readDock(storageKey, defaultDock))
  const [moving, setMoving] = useState(false)
  // Where the widget would land if released now; drives the snap guides.
  const [landing, setLanding] = useState<EdgeDock | null>(null)
  const widgets = useDockStore((s) => s.widgets)
  const initial = dockPoint(dock, storageKey)
  const x = useMotionValue(initial.x)
  const y = useMotionValue(initial.y)
  // Set once a press travels far enough; the click that follows the release is swallowed.
  const movedRef = useRef(false)
  const placedRef = useRef(false)

  // Kept registered after unmount so the page's lanes don't shift while the widget is hidden.
  useLayoutEffect(() => {
    useDockStore.getState().place(storageKey, { dock, priority })
  }, [storageKey, dock, priority])

  // Settle on the spot, moving aside when another widget takes it (or the window shrinks).
  useLayoutEffect(() => {
    if (moving) return
    const p = dockPoint(dock, storageKey)
    if (!placedRef.current) {
      placedRef.current = true
      x.set(p.x)
      y.set(p.y)
      return
    }
    void animate(x, p.x, SPRING)
    void animate(y, p.y, SPRING)
  }, [dock, widgets, moving, storageKey, x, y])

  useEffect(() => {
    if (moving) return
    const place = () => {
      const p = dockPoint(dock, storageKey)
      x.set(p.x)
      y.set(p.y)
    }
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [dock, moving, storageKey, x, y])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled || e.button !== 0) return
      movedRef.current = false
      const startX = e.clientX
      const startY = e.clientY
      const fromX = x.get()
      const fromY = y.get()

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (!movedRef.current) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
          movedRef.current = true
          setMoving(true)
        }
        const nx = clamp(fromX + dx, HALF_W, window.innerWidth - HALF_W)
        const ny = clamp(fromY + dy, HALF_H, window.innerHeight - HALF_H)
        x.set(nx)
        y.set(ny)
        const next = nearestDock(nx, ny)
        setLanding((current) => (sameDock(current, next) ? current : next))
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        if (!movedRef.current) return
        // Settling springs to the new spot (beside any widget already there).
        const next = nearestDock(x.get(), y.get())
        writeDock(storageKey, next)
        setDock(next)
        setLanding(null)
        setMoving(false)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [disabled, storageKey, x, y],
  )

  /** Call from the widget's click handler: true when that click ended a move, not a real click. */
  const consumeMoveClick = useCallback(() => {
    const moved = movedRef.current
    movedRef.current = false
    return moved
  }, [])

  return { dock, moving, landing, x, y, onPointerDown, consumeMoveClick }
}
