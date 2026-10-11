import { RotateCcw, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EXCEL_EXTENSIONS, isExcelFile, MANHOUR_COLUMNS, MANHOUR_SHEETS, REPORT_TEMPLATES } from '@/constants/excel-report'
import { generateReport } from '@/lib/maintenance-report'
import { extractForReport, readManhourFile } from '@/lib/manhour-reader'
import { exportReportExcel, exportReportPdf } from '@/lib/report-export'
import type { GeneratedReport, ImportedSheet, ImportRowStatus, ManhourFile, ReportKind } from '@/types/excel-report'
import { GeneratedReportCard } from './ui/generated-report-card'
import { ImportDropzone } from './ui/import-dropzone'
import { ImportStep } from './ui/import-step'
import { ImportSummary } from './ui/import-summary'
import { ImportTable } from './ui/import-table'
import { ImportedFileRow } from './ui/imported-file-row'
import { RequestHoursTable } from './ui/request-hours-table'
import { TemplatePicker } from './ui/template-picker'

/** "September 2026 · 13 FEP entries of 1,944 · 2 added from On Route, 2 already approved" */
function importMeta(sheet: ImportedSheet, kind: ReportKind): string {
  const added = sheet.rows.filter((r) => r.approval === 'on-route').length
  return [
    sheet.month,
    `${sheet.rows.length} ${kind} entries of ${sheet.totalRows.toLocaleString()}`,
    `${added} added from On Route, ${sheet.onRouteDuplicates} already approved`,
  ].join(' · ')
}

const FILE_TYPES_HINT = '.xlsx, .xlsm (macro-enabled), .xls or .csv'

interface ExcelReportProps {
  onBack: () => void
}

/**
 * Pick the FEP or FEM pre-template, import the whole monthly manhour export (the pre-template keeps
 * only its client's job codes), then generate the report's figures from those entries.
 */
export function ExcelReport({ onBack }: ExcelReportProps) {
  const [kind, setKind] = useState<ReportKind | null>(null)
  const [file, setFile] = useState<ManhourFile | null>(null)
  const [reading, setReading] = useState(false)
  const [readError, setReadError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ImportRowStatus | null>(null)
  const [report, setReport] = useState<GeneratedReport | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  // The file is read once with every job; switching FEP / FEM only re-extracts from it.
  const sheet = useMemo(() => (file && kind ? extractForReport(file, kind) : null), [file, kind])

  const rows = useMemo(
    () => (sheet ? (filter ? sheet.rows.filter((r) => r.status === filter) : sheet.rows) : []),
    [sheet, filter],
  )

  const clearData = () => {
    setFile(null)
    setReadError(null)
    setFilter(null)
    setReport(null)
  }

  const reset = () => {
    clearData()
    setKind(null)
  }

  const pickKind = (next: ReportKind) => {
    setKind(next)
    setReport(null)
    setFilter(null)
  }

  const importFile = async (chosen: File) => {
    if (!isExcelFile(chosen.name)) {
      setReadError(`${chosen.name} isn't an Excel file (${EXCEL_EXTENSIONS.join(', ')}).`)
      return
    }
    setReading(true)
    setReadError(null)
    try {
      setFile(await readManhourFile(chosen))
    } catch (err) {
      setReadError(err instanceof Error ? err.message : `Couldn't read ${chosen.name}.`)
    } finally {
      setReading(false)
    }
  }

  const generate = () => {
    if (!sheet || !kind) return
    setReport(generateReport(sheet, kind))
    setExportError(null)
  }

  const runExport = (exporter: typeof exportReportExcel, label: string) => {
    if (!report || !sheet) return
    try {
      setExportError(null)
      exporter(report, sheet)
    } catch (err) {
      setExportError(`${label} export failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 lg:px-8">
      <header className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-lg font-semibold">Excel report</h1>
          <p className="truncate text-[12px] text-muted-foreground">
            Pick the report, then import the month's manhour file — only that report's jobs are extracted.
          </p>
        </div>
        {kind && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw />
            Start over
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          disabled={!sheet?.rows.length}
          onClick={generate}
        >
          <Sparkles />
          {report ? 'Regenerate' : 'Generate report'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close Excel report"
          className="text-muted-foreground"
          onClick={onBack}
        >
          <X />
        </Button>
      </header>

      <ImportStep
        step={1}
        title="Pre-template"
        description="Built in for each report: which job codes to extract, the monthly plan, and the workbook layout."
      >
        <TemplatePicker value={kind} onChange={pickKind} />
      </ImportStep>

      <AnimatePresence initial={false}>
        {kind && (
          <motion.div
            key="data-step"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <ImportStep
              step={2}
              title="Month manhours"
              tag={kind}
              description={`Import the monthly manhour export as-is — the ${kind} entries (${REPORT_TEMPLATES[kind].jobs
                .map((j) => j.code)
                .join(', ')}) are extracted: all Approved, plus On Route entries Approved doesn't have.`}
            >
              {sheet ? (
                <ImportedFileRow
                  fileName={sheet.fileName}
                  meta={importMeta(sheet, kind)}
                  removeLabel="Remove manhour file"
                  onRemove={clearData}
                />
              ) : (
                <ImportDropzone
                  title="Drop the month's manhour file here"
                  hint={`${FILE_TYPES_HINT} — reads the ${MANHOUR_SHEETS.join(' and ')} sheets: ${MANHOUR_COLUMNS.join(', ')}`}
                  onFile={importFile}
                  busy={reading}
                  error={readError}
                />
              )}
            </ImportStep>
          </motion.div>
        )}
      </AnimatePresence>

      {sheet && kind && sheet.rows.length === 0 && (
        <Card className="items-center gap-1 p-6 text-center">
          <p className="text-sm font-medium">No {kind} entries in this file</p>
          <p className="text-[12px] text-muted-foreground">
            None of its {sheet.totalRows.toLocaleString()} entries are on{' '}
            {REPORT_TEMPLATES[kind].jobs.map((j) => j.code).join(' or ')}. Check the month, or pick the other report.
          </p>
        </Card>
      )}

      {sheet && sheet.rows.length > 0 && (
        <>
          {report && (
            <GeneratedReportCard
              report={report}
              onExportExcel={() => runExport(exportReportExcel, 'Excel')}
              onExportPdf={() => runExport(exportReportPdf, 'PDF')}
              exportError={exportError}
            />
          )}
          {report && <RequestHoursTable kind={report.kind} requests={report.requests} />}
          <ImportSummary rows={sheet.rows} filter={filter} onFilter={setFilter} />
          <ImportTable rows={rows} />
        </>
      )}
    </div>
  )
}
