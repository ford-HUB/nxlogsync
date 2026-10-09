import { animate, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

export type DockSide = 'top' | 'right' | 'bottom' | 'left'

/** Which window edge a docked widget sits on, and where along it (0–1, 0.5 = the middle). */
export interface EdgeDock {
  side: DockSide
  t: number
}

const SIDES: DockSide[] = ['top', 'right', 'bottom', 'left']

/** Half a docked widget's footprint (icon + its widest label), so nothing pokes past the window edge. */
const HALF_W = 64
const HALF_H = 34
const EDGE_GAP = 8
/** Released this close to an edge's middle, the widget centres itself on that edge. */
const SNAP_DISTANCE = 90
/** Pointer travel before a press counts as a move rather than a click. */
const DRAG_THRESHOLD = 4

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

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

/** The widget's centre, in viewport px, for a dock in the current window. */
export function dockPoint({ side, t }: EdgeDock) {
  const w = window.innerWidth
  const h = window.innerHeight
  const alongX = clamp(t * w, EDGE_GAP + HALF_W, w - EDGE_GAP - HALF_W)
  const alongY = clamp(t * h, EDGE_GAP + HALF_H, h - EDGE_GAP - HALF_H)
  switch (side) {
    case 'top':
      return { x: alongX, y: EDGE_GAP + HALF_H }
    case 'bottom':
      return { x: alongX, y: h - EDGE_GAP - HALF_H }
    case 'left':
      return { x: EDGE_GAP + HALF_W, y: alongY }
    case 'right':
      return { x: w - EDGE_GAP - HALF_W, y: alongY }
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
  /** localStorage key the spot is remembered under. */
  storageKey: string
  defaultDock: EdgeDock
  /** Ignores presses (e.g. while something is being dragged onto the widget). */
  disabled?: boolean
}

/**
 * Lets a docked widget (the Trash, the Typing test) be moved with a left-button drag. It always
 * lands on the nearest window edge (outside the centred content column), snapping to that edge's
 * middle when released near it. The spot is remembered across launches and kept on its edge when
 * the window resizes.
 */
export function useEdgeDock({ storageKey, defaultDock, disabled = false }: EdgeDockOptions) {
  const [dock, setDock] = useState(() => readDock(storageKey, defaultDock))
  const [moving, setMoving] = useState(false)
  // Where the widget would land if released now; drives the snap guides.
  const [landing, setLanding] = useState<EdgeDock | null>(null)
  const initial = dockPoint(dock)
  const x = useMotionValue(initial.x)
  const y = useMotionValue(initial.y)
  // Set once a press travels far enough; the click that follows the release is swallowed.
  const movedRef = useRef(false)

  useEffect(() => {
    if (moving) return
    const place = () => {
      const p = dockPoint(dock)
      x.set(p.x)
      y.set(p.y)
    }
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [dock, moving, x, y])

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
        const next = nearestDock(x.get(), y.get())
        const target = dockPoint(next)
        const spring = { type: 'spring', stiffness: 420, damping: 30 } as const
        void animate(x, target.x, spring)
        void animate(y, target.y, spring)
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
