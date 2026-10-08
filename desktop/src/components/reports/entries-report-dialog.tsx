import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { ErrorBanner } from '@/components/feedback/error-banner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatHours, formatMonthLabel } from '@/constants/reports'
import { useEntriesReport } from '@/hooks/use-entries-report'
import { PrintPreviewDialog } from './print-preview-dialog'
import { ReportMonthSection } from './ui/report-month-section'
import { ReportPreviewSkeleton } from './ui/report-preview-skeleton'

interface EntriesReportDialogProps {
  /** "YYYY-MM" the report opens on; null keeps the dialog closed. */
  month: string | null
  onClose: () => void
}

/** Previews every entry in a month range, and prints or exports it as PDF / Excel. */
export function EntriesReportDialog({ month, onClose }: EntriesReportDialogProps) {
  const r = useEntriesReport(month)
  const report = r.report
  const ready = report !== null && !r.loading
  const [printOpen, setPrintOpen] = useState(false)

  return (
    <Dialog open={month !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-3 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Entries report</DialogTitle>
          <DialogDescription className="text-[12px]">
            Every entry logged in the months below, grouped by month. Print it or export it as PDF or Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="outline" size="icon" aria-label="Earlier months" onClick={() => r.shift(-1)} disabled={!r.canShiftBack}>
              <ChevronLeft />
            </Button>
            <MonthSelect label="From" value={r.from} options={r.monthOptions} onChange={r.setFrom} />
            <span className="text-[12px] text-muted-foreground">to</span>
            <MonthSelect label="To" value={r.to} options={r.monthOptions} onChange={r.setTo} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Later months"
              onClick={() => r.shift(1)}
              disabled={!r.canShiftForward}
            >
              <ChevronRight />
            </Button>
          </div>
          {ready && (
            <p className="text-[12px] text-muted-foreground tabular-nums">
              <span className="font-semibold text-foreground">{formatHours(report.totalMinutes)}</span> ·{' '}
              {report.entryCount} {report.entryCount === 1 ? 'entry' : 'entries'} · {report.dayCount}{' '}
              {report.dayCount === 1 ? 'day' : 'days'}
            </p>
          )}
        </div>

        {r.error && <ErrorBanner message={r.error} onDismiss={r.dismissError} />}

        <div className="-mx-1 min-h-48 flex-1 overflow-y-auto rounded-lg border px-1 py-1">
          {!ready ? (
            r.loading && <ReportPreviewSkeleton />
          ) : !r.hasEntries ? (
            <div className="flex h-48 flex-col items-center justify-center gap-1 text-center">
              <FileText className="size-5 text-muted-foreground" />
              <p className="text-[13px] font-medium">Nothing logged in this period</p>
              <p className="text-[12px] text-muted-foreground">Pick other months to preview their entries.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {report.months.map((m) => (
                <ReportMonthSection key={m.month} month={m} />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => void r.copyText()} disabled={!ready || !r.hasEntries}>
            {r.copied ? <Check /> : <Copy />}
            {r.copied ? 'Copied' : 'Copy as text'}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPrintOpen(true)}
              disabled={!ready || !r.hasEntries || r.busy !== null}
            >
              <Printer />
              Print
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void r.exportAs('xlsx')}
              disabled={!ready || r.busy !== null}
            >
              <FileSpreadsheet />
              {r.busy === 'xlsx' ? 'Exporting…' : 'Export Excel'}
            </Button>
            <Button type="button" onClick={() => void r.exportAs('pdf')} disabled={!ready || r.busy !== null}>
              <FileText />
              {r.busy === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </Button>
          </div>
        </DialogFooter>

        {/* Inside the content so Radix treats it as nested and clicks in it don't close this dialog. */}
        <PrintPreviewDialog open={printOpen && month !== null} onOpenChange={setPrintOpen} from={r.from} to={r.to} />
      </DialogContent>
    </Dialog>
  )
}

interface MonthSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (month: string) => void
}

function MonthSelect({ label, value, options, onChange }: MonthSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-40 text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((key) => (
          <SelectItem key={key} value={key}>
            {formatMonthLabel(key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
