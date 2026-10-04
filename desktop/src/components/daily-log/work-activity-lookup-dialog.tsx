import { useState } from 'react'
import { ChevronLeft, ChevronRight, ListChecks, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { WORK_ACTIVITIES, WORK_ACTIVITY_LOOKUP_PAGE_SIZE } from '@/constants/work-activities'
import { cn } from '@/lib/utils'
import type { WorkActivity } from '@/types/daily-log'

interface WorkActivityLookupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The activity already on the draft; pre-highlighted when the dialog opens. */
  value: WorkActivity | null
  onSelect: (activity: WorkActivity) => void
}

export function WorkActivityLookupDialog({ open, onOpenChange, value, onSelect }: WorkActivityLookupDialogProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [highlighted, setHighlighted] = useState<string | null>(value?.code ?? null)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery('')
      setPage(0)
      setHighlighted(value?.code ?? null)
    }
    onOpenChange(next)
  }

  const needle = query.trim().toLowerCase()
  const rows = WORK_ACTIVITIES.filter(
    (activity) =>
      needle === '' ||
      [activity.code, activity.name, activity.details].some((field) => field.toLowerCase().includes(needle)),
  )
  const pageCount = Math.max(1, Math.ceil(rows.length / WORK_ACTIVITY_LOOKUP_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(
    currentPage * WORK_ACTIVITY_LOOKUP_PAGE_SIZE,
    (currentPage + 1) * WORK_ACTIVITY_LOOKUP_PAGE_SIZE,
  )
  const firstRow = rows.length === 0 ? 0 : currentPage * WORK_ACTIVITY_LOOKUP_PAGE_SIZE + 1
  const lastRow = currentPage * WORK_ACTIVITY_LOOKUP_PAGE_SIZE + pageRows.length

  const highlightedActivity = rows.find((activity) => activity.code === highlighted) ?? null

  const choose = (activity: WorkActivity | null) => {
    if (!activity) return
    onSelect(activity)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-3 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="size-4 text-muted-foreground" />
            Work activity lookup
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Pick what kind of work this task was. Double-click a row to select it straight away.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              choose(highlightedActivity ?? (rows.length === 1 ? rows[0] : null))
            }}
            placeholder="Search code, activity or typical tasks"
            className="pl-8 text-[13px]"
          />
        </div>

        <div className="h-80 overflow-auto rounded-lg border">
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-muted text-left text-[11px] tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Code</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Category</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Work activity</th>
                <th className="px-3 py-2 font-medium">Typical tasks</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((activity) => {
                const isHighlighted = activity.code === highlighted
                return (
                  <tr
                    key={activity.code}
                    aria-selected={isHighlighted}
                    onClick={() => setHighlighted(activity.code)}
                    onDoubleClick={() => choose(activity)}
                    className={cn(
                      'cursor-pointer border-t align-top transition-colors',
                      isHighlighted ? 'bg-primary/10' : 'hover:bg-muted/50',
                    )}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{activity.code}</td>
                    <td className="px-3 py-2 text-muted-foreground">{activity.category}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{activity.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{activity.details || '—'}</td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center text-muted-foreground">
                    No work activities match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
          <span className="tabular-nums">
            {firstRow} – {lastRow} of {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </span>
          <div className="flex gap-1">
            <Button type="button" variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
              <ChevronLeft />
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" disabled={!highlightedActivity} onClick={() => choose(highlightedActivity)}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
