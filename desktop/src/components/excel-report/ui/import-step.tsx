import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

interface ImportStepProps {
  step: number
  title: string
  tag?: string
  description: string
  children: ReactNode
}

/** One numbered step of the import, e.g. "1 · Template file  [Template reference]". */
export function ImportStep({ step, title, tag, description, children }: ImportStepProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-semibold tabular-nums">
          {step}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {tag && <Badge variant="secondary">{tag}</Badge>}
          </div>
          <p className="text-[12px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}
