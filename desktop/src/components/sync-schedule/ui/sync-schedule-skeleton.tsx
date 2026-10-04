import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** First-load stand-in for the summary card and the form / side-panel grid below it. */
export function SyncScheduleSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <Card className="shadow-sm">
        <CardContent className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-56" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="h-96 shadow-sm">
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="h-44 shadow-sm">
            <CardContent>
              <Skeleton className="h-5 w-32" />
            </CardContent>
          </Card>
          <Card className="h-64 shadow-sm">
            <CardContent>
              <Skeleton className="h-5 w-28" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
