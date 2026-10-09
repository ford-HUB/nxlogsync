import { animate, useMotionValue } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { SetAsideEntry } from '@/store/trash-store'

/** idle → dragging → (dropping | returning) → idle */
export type RestoreDragPhase = 'idle' | 'dragging' | 'dropping' | 'returning'

/** Pointer travel before a press on a Trash row counts as a drag. */
const DRAG_THRESHOLD = 4

/** The slot under the pointer: how many task rows sit above it, or null when off the list. */
function dropIndexAt(list: HTMLElement | null, px: number, py: number): number | null {
  const rect = list?.getBoundingClientRect()
  if (!list || !rect || px < rect.left || px > rect.right || py < rect.top || py > rect.bottom) return null
  let index = 0
  for (const row of list.querySelectorAll<HTMLElement>('[data-entry-row]')) {
    const r = row.getBoundingClientRect()
    if (py <= r.top + r.height / 2) break
    index++
  }
  return index
}

interface RestoreDragOptions {
  /** The open day's task list; rows inside it carry `data-entry-row`. */
  listRef: RefObject<HTMLElement | null>
  /** The bin, where a drop off the list flies back to. */
  binRef: RefObject<HTMLElement | null>
  /** Places the item at the slot; false when it can't go there (it flies back to the bin). */
  onDrop: (item: SetAsideEntry, index: number) => boolean
}

/**
 * Left-drag a task out of the Trash list onto the open day's task list. While it's over the list,
 * `index` is the slot it would land in (rows don't move under the pointer as the marker opens up,
 * so the slot stays steady). Releasing there hands it to `onDrop`; releasing elsewhere, or Escape,
 * sends it back into the bin.
 */
export function useTrashRestoreDrag({ listRef, binRef, onDrop }: RestoreDragOptions) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const scale = useMotionValue(1)
  const opacity = useMotionValue(1)
  const spin = useMotionValue(0)

  const [item, setItem] = useState<SetAsideEntry | null>(null)
  const [phase, setPhase] = useState<RestoreDragPhase>('idle')
  const [index, setIndex] = useState<number | null>(null)
  const onDropRef = useRef(onDrop)
  useEffect(() => {
    onDropRef.current = onDrop
  })

  const press = useCallback(
    (picked: SetAsideEntry, e: ReactPointerEvent, onStart: () => void) => {
      // The row's own Restore / Discard buttons stay plain clicks.
      if (phase !== 'idle' || e.button !== 0 || (e.target as HTMLElement).closest('button')) return
      const startX = e.clientX
      const startY = e.clientY
      let started = false
      let slot: number | null = null
      const previousSelect = document.body.style.userSelect

      const reset = () => {
        setItem(null)
        setIndex(null)
        setPhase('idle')
      }

      const stop = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onCancel)
        window.removeEventListener('keydown', onKey)
        document.body.style.userSelect = previousSelect
      }

      const flyBack = () => {
        setPhase('returning')
        setIndex(null)
        const rect = binRef.current?.getBoundingClientRect()
        const transition = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }
        void Promise.all([
          rect ? animate(x, rect.left + rect.width / 2, transition) : undefined,
          rect ? animate(y, rect.top + rect.height * 0.4, transition) : undefined,
          animate(scale, 0.15, transition),
          animate(opacity, [1, 1, 0], { ...transition, times: [0, 0.75, 1] }),
        ]).then(reset)
      }

      function onMove(ev: PointerEvent) {
        if (!started) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return
          started = true
          document.body.style.userSelect = 'none'
          spin.set(0)
          opacity.set(1)
          scale.set(0.6)
          void animate(scale, 1, { type: 'spring', stiffness: 500, damping: 24 })
          setItem(picked)
          setPhase('dragging')
          onStart()
        }
        x.set(ev.clientX)
        y.set(ev.clientY)
        slot = dropIndexAt(listRef.current, ev.clientX, ev.clientY)
        setIndex(slot)
      }

      function onUp() {
        stop()
        if (!started) return
        if (slot === null || !onDropRef.current(picked, slot)) return flyBack()
        setPhase('dropping')
        setIndex(null)
        const transition = { duration: 0.2, ease: 'easeOut' } as const
        void Promise.all([animate(scale, 0.85, transition), animate(opacity, 0, transition)]).then(reset)
      }

      function onCancel() {
        stop()
        if (started) flyBack()
      }

      function onKey(ev: KeyboardEvent) {
        if (ev.key === 'Escape') onCancel()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      window.addEventListener('keydown', onKey)
    },
    [phase, listRef, binRef, x, y, scale, opacity, spin],
  )

  return { item, phase, index, press, motion: { x, y, scale, opacity, spin } }
}
