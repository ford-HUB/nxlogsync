import { Skeleton } from '@/components/ui/skeleton'

/** Mirrors EntryItem rows: same padding, the 268px time column, and a description line. */
export function EntryListSkeleton({ rows }: { rows: number }) {
  return (
    <ul aria-hidden className="flex flex-col gap-0.5">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:gap-6">
          <span className="flex h-6 shrink-0 items-center gap-2 sm:w-[268px]">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </span>
          <span className="flex h-6 flex-1 items-center">
            <Skeleton className="h-4 w-3/4" />
          </span>
        </li>
      ))}
    </ul>
  )
}
