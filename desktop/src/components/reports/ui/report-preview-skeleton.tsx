import { Skeleton } from '@/components/ui/skeleton'

const ROWS = 6

/** Stands in for the report preview while it loads. */
export function ReportPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-8 w-full rounded-md" />
      {Array.from({ length: ROWS }, (_, i) => (
        <div key={i} className="grid grid-cols-[88px_180px_1fr_72px] gap-3 px-3 py-1.5">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
        </div>
      ))}
    </div>
  )
}
