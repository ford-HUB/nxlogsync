import { FileDown, Printer } from 'lucide-react'
import { ErrorBanner } from '@/components/feedback/error-banner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MAX_PRINT_COPIES, SAVE_AS_PDF_VALUE } from '@/constants/printing'
import { formatPeriodLabel } from '@/constants/reports'
import { usePrintPreview, type PageSelection } from '@/hooks/use-print-preview'
import { PrintPagePreview } from './ui/print-page-preview'

interface PrintPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The report range, "YYYY-MM". */
  from: string
  to: string
}

/**
 * Print with a preview, like a browser's Ctrl+P: the report PDF's pages on the
 * left, printer and page settings on the right. Windows' own dialog shows no
 * preview for this app, so printing goes straight to the chosen printer.
 */
export function PrintPreviewDialog({ open, onOpenChange, from, to }: PrintPreviewDialogProps) {
  const p = usePrintPreview(open, from, to, () => onOpenChange(false))
  const sheets = p.sheetCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[88vh] w-full grid-cols-1 gap-0 overflow-hidden p-0 sm:max-w-5xl md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-h-0 overflow-y-auto bg-muted/60">
          <PrintPagePreview pages={p.pages} selected={p.previewPages} loading={p.loading} />
        </div>

        <div className="flex min-h-0 flex-col gap-5 border-l p-5">
          <div className="flex flex-col gap-0.5">
            <DialogTitle>Print</DialogTitle>
            <DialogDescription className="text-[12px]">
              Entries report · {formatPeriodLabel(from, to)}
              {!p.loading && p.pages.length > 0 && (
                <>
                  {' · '}
                  {p.savingPdf ? `${p.pages.length} ${p.pages.length === 1 ? 'page' : 'pages'}` : `${sheets} ${sheets === 1 ? 'sheet' : 'sheets'} of paper`}
                </>
              )}
            </DialogDescription>
          </div>

          {p.error && <ErrorBanner message={p.error} />}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="print-destination" className="text-[12px] text-muted-foreground">
              Destination
            </Label>
            <Select value={p.destination} onValueChange={p.setDestination} disabled={p.loading || p.printing}>
              <SelectTrigger id="print-destination" className="w-full text-[13px]">
                <SelectValue placeholder="Loading printers…" />
              </SelectTrigger>
              <SelectContent>
                {p.printers.map((printer) => (
                  <SelectItem key={printer.name} value={printer.name}>
                    {printer.displayName}
                    {printer.isDefault && <span className="text-muted-foreground"> · default</span>}
                  </SelectItem>
                ))}
                {p.printers.length > 0 && <SelectSeparator />}
                <SelectItem value={SAVE_AS_PDF_VALUE}>Save as PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="print-pages" className="text-[12px] text-muted-foreground">
              Pages
            </Label>
            <Select
              value={p.pageSelection}
              onValueChange={(v) => p.setPageSelection(v as PageSelection)}
              disabled={p.loading || p.printing || p.savingPdf}
            >
              <SelectTrigger id="print-pages" className="w-full text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {p.pageSelection === 'custom' && !p.savingPdf && (
              <>
                <Input
                  aria-label="Pages to print"
                  placeholder={`e.g. 1-${Math.max(1, p.pages.length)}, 1, 3`}
                  value={p.customPages}
                  onChange={(e) => p.setCustomPages(e.target.value)}
                  aria-invalid={p.pagesInvalid}
                  className="text-[13px]"
                />
                {p.pagesInvalid && (
                  <p role="alert" className="text-[12px] text-destructive">
                    Use pages between 1 and {p.pages.length}, like 1-3, 5.
                  </p>
                )}
              </>
            )}
          </div>

          {!p.savingPdf && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="print-copies" className="text-[12px] text-muted-foreground">
                Copies
              </Label>
              <Input
                id="print-copies"
                type="number"
                min={1}
                max={MAX_PRINT_COPIES}
                value={p.copies}
                onChange={(e) => p.setCopies(Number(e.target.value))}
                disabled={p.loading || p.printing}
                className="w-24 text-[13px]"
              />
            </div>
          )}

          <div className="mt-auto flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void p.submit()} disabled={!p.canSubmit}>
              {p.savingPdf ? <FileDown /> : <Printer />}
              {p.savingPdf ? 'Save' : p.printing ? 'Printing…' : 'Print'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
