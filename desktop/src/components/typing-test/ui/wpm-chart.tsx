import { useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { TypingSecond } from '@/types/typing-test'

interface WpmChartProps {
  history: TypingSecond[]
}

const HEIGHT = 180
const PAD = { top: 12, right: 12, bottom: 24, left: 34 }

/** A rounded-up axis maximum with four even steps. */
function niceMax(value: number) {
  const step = Math.max(5, Math.ceil(value / 4 / 5) * 5)
  return { max: step * 4, step }
}

/**
 * The test second by second: net wpm (yellow), raw speed that second (grey), and an x for each
 * second with mistakes. Hover a second for its numbers.
 */
export function WpmChart({ history }: WpmChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { max, step } = niceMax(Math.max(...history.map((h) => Math.max(h.wpm, h.raw)), 10))
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const span = Math.max(history.length - 1, 1)
  const x = (i: number) => PAD.left + (history.length === 1 ? plotW / 2 : (i / span) * plotW)
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const path = (key: 'wpm' | 'raw') => history.map((h, i) => `${i ? 'L' : 'M'}${x(i)},${y(h[key])}`).join('')
  const labelEvery = Math.ceil(history.length / 10)
  const hovered = hover !== null ? history[hover] : null

  const onMove = (e: ReactPointerEvent<SVGRectElement>) => {
    const left = e.currentTarget.getBoundingClientRect().left
    const i = Math.round(((e.clientX - left) / plotW) * span)
    setHover(Math.min(Math.max(i, 0), history.length - 1))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-score" /> wpm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-muted-foreground/60" /> raw
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-destructive">×</span> errors
        </span>
      </div>

      <div ref={ref} className="relative w-full" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} className="overflow-visible">
            {Array.from({ length: 5 }, (_, i) => i * step).map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                  {v}
                </text>
              </g>
            ))}
            {history.map((h, i) =>
              i % labelEvery === 0 || i === history.length - 1 ? (
                <text key={h.second} x={x(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
                  {h.second}
                </text>
              ) : null,
            )}

            <path d={path('raw')} fill="none" className="stroke-muted-foreground/50" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={path('wpm')} fill="none" className="stroke-score" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {history.map((h, i) =>
              h.errors > 0 ? (
                <text key={`e${h.second}`} x={x(i)} y={PAD.top + 4} textAnchor="middle" dy="0.32em" className="fill-destructive text-[11px] font-semibold">
                  ×
                </text>
              ) : null,
            )}

            {hovered && hover !== null && (
              <g className="pointer-events-none">
                <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-foreground/30" strokeWidth={1} />
                <circle cx={x(hover)} cy={y(hovered.raw)} r={4} className="fill-muted-foreground stroke-background" strokeWidth={2} />
                <circle cx={x(hover)} cy={y(hovered.wpm)} r={4} className="fill-score stroke-background" strokeWidth={2} />
              </g>
            )}
            <rect
              x={PAD.left}
              y={PAD.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        )}

        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-28 rounded-md border bg-popover px-2.5 py-1.5 text-[11px] shadow-md"
            style={{
              left: x(hover),
              transform: `translateX(${x(hover) > width / 2 ? 'calc(-100% - 10px)' : '10px'})`,
            }}
          >
            <p className="mb-1 font-medium">second {hovered.second}</p>
            <p className="flex justify-between gap-3 text-muted-foreground">
              wpm <span className="font-medium text-foreground tabular-nums">{Math.round(hovered.wpm)}</span>
            </p>
            <p className="flex justify-between gap-3 text-muted-foreground">
              raw <span className="font-medium text-foreground tabular-nums">{Math.round(hovered.raw)}</span>
            </p>
            <p className="flex justify-between gap-3 text-muted-foreground">
              errors <span className="font-medium text-foreground tabular-nums">{hovered.errors}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
