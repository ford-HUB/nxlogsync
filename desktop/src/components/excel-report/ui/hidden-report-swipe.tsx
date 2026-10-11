import { useRef, useState } from 'react'

interface HiddenReportSwipeProps {
  onOpen: () => void
}

/** How far left (px) a drag from the corner must travel to open the page. */
const SWIPE_OPEN_PX = 90

/** A drag shorter than this (px) is a click or hand jitter, not a slide: no arrow yet. */
const SWIPE_START_PX = 6

/** The furthest (px) the arrow drifts back from the edge, however far the drag goes. */
const ARROW_TRAVEL_PX = 40

/** The arrow lags the pointer and eases into its travel limit, like pulling against a spring. */
const arrowOffset = (dx: number) => ARROW_TRAVEL_PX * (1 - Math.exp(-dx / (ARROW_TRAVEL_PX * 2.5)))

/**
 * An invisible strip on the window's right edge, just under the native minimise / maximise / close
 * buttons. Dragging from it towards the left opens the Excel report; a small "->" pointing at the
 * right edge drifts slowly backwards with the drag and goes fully solid near the open distance.
 */
export function HiddenReportSwipe({ onOpen }: HiddenReportSwipeProps) {
  const startX = useRef<number | null>(null)
  const [dx, setDx] = useState(0)
  const progress = Math.min(1, dx / SWIPE_OPEN_PX)

  const end = () => {
    startX.current = null
    setDx(0)
  }

  return (
    <div
      aria-hidden
      onPointerDown={(e) => {
        startX.current = e.clientX
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (startX.current === null) return
        setDx(Math.max(0, startX.current - e.clientX))
      }}
      onPointerUp={() => {
        if (dx >= SWIPE_OPEN_PX) onOpen()
        end()
      }}
      onPointerCancel={end}
      className="fixed top-0 right-0 z-40 h-10 w-5 touch-none select-none"
    >
      {dx >= SWIPE_START_PX && (
        <svg
          width={16}
          height={12}
          viewBox="0 0 16 12"
          style={{ transform: `translate(${-arrowOffset(dx)}px, -50%)`, opacity: 0.75 + progress * 0.25 }}
          className="pointer-events-none absolute top-1/2 right-1 text-foreground"
        >
          <line x1={1.5} y1={6} x2={14} y2={6} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
          <polyline
            points="9.5,1.5 14,6 9.5,10.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
