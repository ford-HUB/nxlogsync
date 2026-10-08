import { Skeleton } from '@/components/ui/skeleton'

interface PrintPagePreviewProps {
  /** Rendered PDF pages as image URLs. */
  pages: string[]
  /** 1-based pages that will print; the rest are dimmed. */
  selected: number[]
  loading: boolean
}

/** The report's actual PDF pages, stacked like a print preview. */
export function PrintPagePreview({ pages, selected, loading }: PrintPagePreviewProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6 p-6" aria-hidden>
        <Skeleton className="aspect-[210/297] w-full max-w-md rounded-sm" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {pages.map((src, i) => {
        const number = i + 1
        const included = selected.includes(number)
        return (
          <figure key={number} className="flex w-full max-w-md flex-col items-center gap-1.5">
            <img
              src={src}
              alt={`Page ${number}`}
              className={`w-full rounded-sm bg-white shadow-md ring-1 ring-black/5 transition-opacity ${included ? '' : 'opacity-30'}`}
            />
            <figcaption className="text-[11px] text-muted-foreground tabular-nums">
              Page {number} of {pages.length}
            </figcaption>
          </figure>
        )
      })}
    </div>
  )
}
