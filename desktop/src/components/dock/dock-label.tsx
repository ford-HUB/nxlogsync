import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** The caption under a docked widget's icon. */
export function DockLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap transition-colors',
        className,
      )}
    >
      {children}
    </span>
  )
}
