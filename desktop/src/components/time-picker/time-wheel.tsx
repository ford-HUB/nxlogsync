import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import {
  WHEEL_ITEM_HEIGHT,
  WHEEL_SETTLE_MS,
  WHEEL_STEP_DELTA,
  WHEEL_VISIBLE_ITEMS,
} from '@/constants/daily-log'
import type { WheelOption } from '@/types/daily-log'

interface TimeWheelProps {
  options: WheelOption[]
  value: number
  onChange: (value: number) => void
  label: string
  /** Values that cannot be picked; the wheel skips over them and never settles on one. */
  disabledValues?: ReadonlySet<number>
  /** Locks the whole wheel: no scrolling, clicking or keyboard focus. */
  disabled?: boolean
  /** Wraps around (12 → 1 → 2 …) instead of stopping at either end. */
  loop?: boolean
  className?: string
}

const NO_DISABLED: ReadonlySet<number> = new Set()

/** Copies of the options a looping wheel renders; it re-centres on the middle one when it settles. */
const LOOP_COPIES = 5

const SIDE_PADDING = WHEEL_ITEM_HEIGHT * Math.floor(WHEEL_VISIBLE_ITEMS / 2)

/**
 * iOS-style scroll wheel: CSS scroll-snap does the physics, the value commits once
 * scrolling settles. Mouse wheel advances one item per notch; arrows/Home/End work too.
 * Disabled values are skipped when stepping, and a scroll that stops on one snaps to
 * the nearest enabled value.
 */
export function TimeWheel({
  options,
  value,
  onChange,
  label,
  disabledValues = NO_DISABLED,
  disabled: wheelDisabled = false,
  loop = false,
  className,
}: TimeWheelProps) {
  const id = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<number>()
  const targetIndex = useRef<number | null>(null)
  const wheelDelta = useRef(0)
  const isMounted = useRef(false)

  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const disabledRef = useRef(disabledValues)
  valueRef.current = value
  onChangeRef.current = onChange
  disabledRef.current = disabledValues

  // A looping wheel lays out several copies of the options and keeps to the middle
  // one, so there is always more to scroll either way.
  const count = options.length
  const items = loop ? Array.from({ length: count * LOOP_COPIES }, (_, i) => options[i % count]) : options
  const middleOffset = loop ? count * Math.floor(LOOP_COPIES / 2) : 0
  /** The same option's index in the middle copy. */
  const toMiddle = useCallback((index: number) => middleOffset + (index % count), [middleOffset, count])

  const selectedIndex = middleOffset + Math.max(0, options.findIndex((o) => o.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  const clampIndex = useCallback(
    (index: number) => Math.min(items.length - 1, Math.max(0, index)),
    [items.length],
  )

  const isDisabledAt = useCallback(
    (index: number) => disabledRef.current.has(options[index % count].value),
    [options, count],
  )

  /** First enabled index from `index` stepping by `direction`, else the closest either way. */
  const resolveEnabled = useCallback(
    (index: number, direction?: number): number | null => {
      if (direction) {
        for (let i = index; i >= 0 && i < items.length; i += direction) {
          if (!isDisabledAt(i)) return i
        }
        return null
      }
      for (let d = 0; d < items.length; d++) {
        if (index + d < items.length && !isDisabledAt(index + d)) return index + d
        if (index - d >= 0 && !isDisabledAt(index - d)) return index - d
      }
      return null
    },
    [items.length, isDisabledAt],
  )

  const scrollToIndex = useCallback(
    (index: number, direction?: number) => {
      const el = listRef.current
      if (!el) return
      const next = resolveEnabled(clampIndex(index), direction)
      if (next === null) return
      targetIndex.current = next
      el.scrollTo({ top: next * WHEEL_ITEM_HEIGHT, behavior: 'smooth' })
    },
    [clampIndex, resolveEnabled],
  )

  // External value → wheel position (instant on first paint, smooth afterwards).
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    setActiveIndex(selectedIndex)
    const top = selectedIndex * WHEEL_ITEM_HEIGHT
    if (Math.abs(el.scrollTop - top) >= 1) {
      el.scrollTo({ top, behavior: isMounted.current ? 'smooth' : 'auto' })
    }
    isMounted.current = true
  }, [selectedIndex])

  // Non-passive so a mouse notch moves exactly one item instead of flinging.
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      wheelDelta.current += event.deltaY
      if (Math.abs(wheelDelta.current) < WHEEL_STEP_DELTA) return
      const direction = Math.sign(wheelDelta.current)
      wheelDelta.current = 0
      const from = targetIndex.current ?? Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)
      scrollToIndex(from + direction, direction)
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [scrollToIndex])

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const index = clampIndex(Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT))
    setActiveIndex(index)

    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      targetIndex.current = null
      if (isDisabledAt(index)) {
        const fallback = resolveEnabled(index)
        if (fallback !== null) scrollToIndex(fallback)
        return
      }
      // Jump back to the middle copy without animating; it shows the same items.
      const centred = loop ? toMiddle(index) : index
      if (centred !== index) {
        el.scrollTo({ top: centred * WHEEL_ITEM_HEIGHT, behavior: 'auto' })
        setActiveIndex(centred)
      }
      const settled = items[index].value
      if (settled !== valueRef.current) onChangeRef.current(settled)
    }, WHEEL_SETTLE_MS)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = targetIndex.current ?? activeIndex
    const moves: Record<string, [index: number, direction: number]> = {
      ArrowUp: [from - 1, -1],
      ArrowDown: [from + 1, 1],
      PageUp: [from - WHEEL_VISIBLE_ITEMS, -1],
      PageDown: [from + WHEEL_VISIBLE_ITEMS, 1],
      Home: [middleOffset, 1],
      End: [middleOffset + count - 1, -1],
    }
    if (!(event.key in moves)) return
    event.preventDefault()
    scrollToIndex(...moves[event.key])
  }

  return (
    <div
      className={cn(
        'rounded-lg has-focus-visible:ring-2 has-focus-visible:ring-ring/50',
        className,
      )}
    >
      <div
        ref={listRef}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`${id}-${activeIndex}`}
        aria-disabled={wheelDisabled || undefined}
        tabIndex={wheelDisabled ? -1 : 0}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="relative snap-y snap-mandatory overflow-y-scroll overscroll-contain outline-none [scrollbar-width:none] [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_65%,transparent)] [&::-webkit-scrollbar]:hidden"
        style={{
          height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS,
          paddingBlock: SIDE_PADDING,
        }}
      >
        {items.map((option, index) => {
          const distance = Math.abs(index - activeIndex)
          const disabled = disabledValues.has(option.value)
          return (
            <button
              key={index}
              id={`${id}-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              aria-disabled={disabled || undefined}
              disabled={disabled}
              tabIndex={-1}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'flex w-full cursor-pointer snap-center items-center justify-center tabular-nums select-none transition-[color,opacity,transform] duration-150',
                distance === 0 && 'text-sm font-semibold text-foreground',
                distance === 1 && 'text-xs text-muted-foreground',
                distance >= 2 && 'text-xs text-muted-foreground/50',
                disabled && 'cursor-not-allowed text-muted-foreground/30 line-through',
              )}
              style={{ height: WHEEL_ITEM_HEIGHT }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
