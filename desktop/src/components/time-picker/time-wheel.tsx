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
  className?: string
}

const NO_DISABLED: ReadonlySet<number> = new Set()

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

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)

  const clampIndex = useCallback(
    (index: number) => Math.min(options.length - 1, Math.max(0, index)),
    [options.length],
  )

  const isDisabledAt = useCallback(
    (index: number) => disabledRef.current.has(options[index].value),
    [options],
  )

  /** First enabled index from `index` stepping by `direction`, else the closest either way. */
  const resolveEnabled = useCallback(
    (index: number, direction?: number): number | null => {
      if (direction) {
        for (let i = index; i >= 0 && i < options.length; i += direction) {
          if (!isDisabledAt(i)) return i
        }
        return null
      }
      for (let d = 0; d < options.length; d++) {
        if (index + d < options.length && !isDisabledAt(index + d)) return index + d
        if (index - d >= 0 && !isDisabledAt(index - d)) return index - d
      }
      return null
    },
    [options.length, isDisabledAt],
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
      const settled = options[index].value
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
      Home: [0, 1],
      End: [options.length - 1, -1],
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
        {options.map((option, index) => {
          const distance = Math.abs(index - activeIndex)
          const disabled = disabledValues.has(option.value)
          return (
            <button
              key={option.value}
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
