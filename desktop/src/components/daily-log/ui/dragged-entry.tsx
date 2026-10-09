import { FileText } from 'lucide-react'
import { motion, useSpring, useTransform, useVelocity, type MotionValue } from 'motion/react'
import { formatClock } from '@/constants/time-format'
import { cn } from '@/lib/utils'
import type { LogEntry } from '@/types/daily-log'

interface DraggedEntryProps {
  entry: LogEntry
  over: boolean
  x: MotionValue<number>
  y: MotionValue<number>
  scale: MotionValue<number>
  opacity: MotionValue<number>
  spin: MotionValue<number>
}

/** The task picked up as a little file, pinned under the pointer and tilting as it swings. */
export function DraggedEntry({ entry, over, x, y, scale, opacity, spin }: DraggedEntryProps) {
  const swing = useSpring(useVelocity(x), { stiffness: 300, damping: 30 })
  const tilt = useTransform(swing, [-1600, 1600], [-18, 18], { clamp: true })

  return (
    <motion.div style={{ x, y }} className="pointer-events-none fixed top-0 left-0 z-50">
      <motion.div style={{ scale, opacity, rotate: tilt }}>
        <motion.div
          style={{ rotate: spin }}
          className={cn(
            'relative -mt-7 -ml-6 flex w-48 items-center gap-2 rounded-md border bg-card py-2 pr-6 pl-2 shadow-xl transition-colors',
            over ? 'border-foreground' : 'border-border',
          )}
        >
          {/* Folded corner. */}
          <span className="absolute top-0 right-0 size-4 rounded-bl-sm border-b border-l bg-muted" />
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded transition-colors',
              over ? 'bg-foreground text-background' : 'bg-muted text-foreground',
            )}
          >
            <FileText className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[11px] font-medium tabular-nums">
              {formatClock(entry.startMinutes)} – {formatClock(entry.endMinutes)}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">{entry.description}</span>
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
