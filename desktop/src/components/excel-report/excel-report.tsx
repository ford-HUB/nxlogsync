import { RotateCcw, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EXCEL_EXTENSIONS, isExcelFile, MANHOUR_COLUMNS, MANHOUR_SHEETS, REPORT_TEMPLATES } from '@/constants/excel-report'
import { generateReport } from '@/lib/maintenance-report'
import { fillWorkbook, type LoadedWorkbook, readMaintenanceWorkbook } from '@/lib/maintenance-workbook'
import { extractForReport, readManhourFile } from '@/lib/manhour-reader'
import { exportReportExcel, exportReportPdf } from '@/lib/report-export'
import type {
  FilledWorkbook,
  GeneratedReport,
  ImportedSheet,
  ImportRowStatus,
  ManhourFile,
  MaintenanceWorkbook,
  ReportKind,
} from '@/types/excel-report'
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

const MONTH_SHORT = new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' })
/** "2026-08" → "Aug 26" */
const shortMonth = (key: string) => MONTH_SHORT.format(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1))

/** "Jul 26 – Jun 27 · 19 activities, 17 requests · filled up to Aug 26" */
function workbookMeta(workbook: MaintenanceWorkbook): string {
  const last = workbook.activities[workbook.activities.length - 1]?.month
  return [
    `${shortMonth(workbook.months[0])} – ${shortMonth(workbook.months[11])}`,
    `${workbook.activities.length} activities, ${workbook.requests.length} requests`,
    last ? `filled up to ${shortMonth(last)}` : 'no months filled yet',
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
  const [yearly, setYearly] = useState<LoadedWorkbook | null>(null)
  const [yearlyReading, setYearlyReading] = useState(false)
  const [yearlyError, setYearlyError] = useState<string | null>(null)
  const [filled, setFilled] = useState<FilledWorkbook | null>(null)

  // The file is read once with every job; switching FEP / FEM only re-extracts from it.
  const sheet = useMemo(() => (file && kind ? extractForReport(file, kind) : null), [file, kind])

  const rows = useMemo(
    () => (sheet ? (filter ? sheet.rows.filter((r) => r.status === filter) : sheet.rows) : []),
    [sheet, filter],
  )

  const clearReport = () => {
    setReport(null)
    setFilled(null)
    setExportError(null)
  }

  const clearData = () => {
    setFile(null)
    setReadError(null)
    setFilter(null)
    clearReport()
  }

  const clearYearly = () => {
    setYearly(null)
    setYearlyError(null)
    clearReport()
  }

  const reset = () => {
    clearData()
    clearYearly()
    setKind(null)
  }

  const pickKind = (next: ReportKind) => {
    if (next !== kind) clearYearly()
    setKind(next)
    clearReport()
    setFilter(null)
  }

  const importYearly = async (chosen: File) => {
    if (!isExcelFile(chosen.name)) {
      setYearlyError(`${chosen.name} isn't an Excel file (${EXCEL_EXTENSIONS.join(', ')}).`)
      return
    }
    const other = kind === 'FEP' ? 'FEM' : 'FEP'
    if (kind && new RegExp(`\\b${other}\\b`, 'i').test(chosen.name) && !new RegExp(`\\b${kind}\\b`, 'i').test(chosen.name)) {
      setYearlyError(`${chosen.name} looks like the ${other} workbook; pick the ${kind} one.`)
      return
    }
    setYearlyReading(true)
    setYearlyError(null)
    try {
      setYearly(await readMaintenanceWorkbook(chosen))
      clearReport()
    } catch (err) {
      setYearlyError(err instanceof Error ? err.message : `Couldn't read ${chosen.name}.`)
    } finally {
      setYearlyReading(false)
    }
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

  // The month is written into the yearly workbook on Generate; both exports come from that copy.
  const generate = () => {
    if (!sheet || !kind || !yearly) return
    const next = generateReport(sheet, kind)
    setReport(next)
    setFilled(null)
    setExportError(null)
    try {
      setFilled(fillWorkbook(yearly, next, sheet))
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err))
    }
  }

  const runExport = (exporter: (filled: FilledWorkbook) => void, label: string) => {
    if (!filled) return
    try {
      setExportError(null)
      exporter(filled)
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
            Pick the report, import the month's manhour file and last month's yearly workbook — the month is added to it.
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
          disabled={!sheet?.rows.length || !yearly}
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

      <AnimatePresence initial={false}>
        {kind && (
          <motion.div
            key="yearly-step"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <ImportStep
              step={3}
              title="Yearly workbook"
              tag={kind}
              description={`Import last month's ${kind} Monthly Maintenance Report workbook — the month is added to it (overview, activities, request blocks, hours and data), keeping its charts, stamps and earlier months.`}
            >
              {yearly ? (
                <ImportedFileRow
                  fileName={yearly.fileName}
                  meta={workbookMeta(yearly.workbook)}
                  removeLabel="Remove yearly workbook"
                  onRemove={clearYearly}
                />
              ) : (
                <ImportDropzone
                  title={`Drop the ${kind} yearly workbook here`}
                  hint=".xlsm or .xlsx — e.g. FEM Monthly Maintenance Report 2026 - 2027.xlsm; macros are never run"
                  onFile={importYearly}
                  busy={yearlyReading}
                  error={yearlyError}
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
              onExportPdf={() => runExport((f) => exportReportPdf(f, report, sheet), 'PDF')}
              canExport={!!filled}
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
