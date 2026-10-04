import { useState } from 'react'
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Search } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_COST_CENTER, JOB_LOOKUP_PAGE_SIZE, COST_CENTERS, JOBS } from '@/constants/jobs'
import { cn } from '@/lib/utils'
import type { Job } from '@/types/daily-log'

interface JobLookupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The job already on the draft; pre-highlighted when the dialog opens. */
  value: Job | null
  onSelect: (job: Job) => void
}

/** "ALL" jobs belong to every cost center. */
function matchesCostCenter(job: Job, costCenter: string) {
  return job.costCenter === 'ALL' || job.costCenter === costCenter
}

export function JobLookupDialog({ open, onOpenChange, value, onSelect }: JobLookupDialogProps) {
  const [costCenter, setCostCenter] = useState(DEFAULT_COST_CENTER)
  const [external, setExternal] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [highlighted, setHighlighted] = useState<string | null>(value?.code ?? null)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setCostCenter(DEFAULT_COST_CENTER)
      setExternal(false)
      setQuery('')
      setPage(0)
      setHighlighted(value?.code ?? null)
    }
    onOpenChange(next)
  }

  const needle = query.trim().toLowerCase()
  const rows = JOBS.filter(
    (job) =>
      matchesCostCenter(job, costCenter) &&
      job.external === external &&
      (needle === '' ||
        [job.code, job.clientJobNo, job.clientJobName].some((field) => field.toLowerCase().includes(needle))),
  )
  const pageCount = Math.max(1, Math.ceil(rows.length / JOB_LOOKUP_PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = rows.slice(currentPage * JOB_LOOKUP_PAGE_SIZE, (currentPage + 1) * JOB_LOOKUP_PAGE_SIZE)
  const firstRow = rows.length === 0 ? 0 : currentPage * JOB_LOOKUP_PAGE_SIZE + 1
  const lastRow = currentPage * JOB_LOOKUP_PAGE_SIZE + pageRows.length

  const highlightedJob = rows.find((job) => job.code === highlighted) ?? null

  const choose = (job: Job | null) => {
    if (!job) return
    onSelect(job)
    onOpenChange(false)
  }

  const resetPaging = () => setPage(0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-3 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="size-4 text-muted-foreground" />
            Job lookup
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Pick the job this task is charged to. Double-click a row to select it straight away.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-1 flex-col gap-1.5">
            <Label className="text-[11px] tracking-wider text-muted-foreground uppercase">Cost center</Label>
            <Select
              value={costCenter}
              onValueChange={(next) => {
                setCostCenter(next)
                resetPaging()
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_CENTERS.map((center) => (
                  <SelectItem key={center} value={center}>
                    {center}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex h-8 items-center gap-2">
            <Switch
              id="job-lookup-external"
              checked={external}
              onCheckedChange={(next) => {
                setExternal(next)
                resetPaging()
              }}
            />
            <Label htmlFor="job-lookup-external" className="text-[12px]">
              EXT
            </Label>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              resetPaging()
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              choose(highlightedJob ?? (rows.length === 1 ? rows[0] : null))
            }}
            placeholder="Search job code, client job no or name"
            className="pl-8 text-[13px]"
          />
        </div>

        <div className="h-72 overflow-auto rounded-lg border">
          <table className="w-full min-w-[640px] border-collapse text-[12px]">
            <thead className="sticky top-0 z-10 bg-muted text-left text-[11px] tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Job code</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Client job no</th>
                <th className="px-3 py-2 font-medium">Client job name</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Cost center</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((job) => {
                const isHighlighted = job.code === highlighted
                return (
                  <tr
                    key={job.code}
                    aria-selected={isHighlighted}
                    onClick={() => setHighlighted(job.code)}
                    onDoubleClick={() => choose(job)}
                    className={cn(
                      'cursor-pointer border-t transition-colors',
                      isHighlighted ? 'bg-primary/10' : 'hover:bg-muted/50',
                    )}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap tabular-nums">{job.code}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{job.clientJobNo || '—'}</td>
                    <td className="px-3 py-2">{job.clientJobName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{job.costCenter}</td>
                  </tr>
                )
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center text-muted-foreground">
                    No jobs match this cost center and search.
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
          <Button type="button" disabled={!highlightedJob} onClick={() => choose(highlightedJob)}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
