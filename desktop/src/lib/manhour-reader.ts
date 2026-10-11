import * as XLSX from 'xlsx'
import {
  MANHOUR_HEADER_SEARCH_ROWS,
  MANHOUR_HEADERS,
  MANHOUR_REQUIRED,
  MANHOUR_SHEET_NAMES,
  REPORT_TEMPLATES,
} from '@/constants/excel-report'
import { mergeManhourSheets } from '@/lib/manhour-entries'
import type { ImportedSheet, ManhourEntry, ManhourFile, ReportKind } from '@/types/excel-report'

type Field = keyof typeof MANHOUR_HEADERS
type Cell = string | number | boolean | Date | null

const normalize = (v: Cell) => String(v ?? '').trim().replace(/\s+/g, ' ').toUpperCase()

const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

/** A sheet by name, ignoring case and spacing ("On Route " finds "On Route"). */
function findSheet(workbook: XLSX.WorkBook, name: string): XLSX.WorkSheet | null {
  const match = workbook.SheetNames.find((n) => normalize(n) === normalize(name))
  return match ? workbook.Sheets[match] : null
}

/** An Excel date serial or text date → "2026-09-01"; null when it is not a date. */
function toDateKey(v: Cell): string | null {
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const text = String(v ?? '').trim()
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text)
  if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
  return null
}

function toHours(v: Cell): number | null {
  if (typeof v === 'number') return v
  const text = String(v ?? '').trim()
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

/**
 * Reads one sheet's entries: finds the header row near the top, maps columns by header text (so
 * column order and a leading blank column don't matter), and skips rows with no date and job code.
 */
function readSheet(sheet: XLSX.WorkSheet, sheetName: string): ManhourEntry[] {
  const grid = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: true, defval: null, blankrows: false })
  const headerIndex = grid
    .slice(0, MANHOUR_HEADER_SEARCH_ROWS)
    .findIndex((row) => row.some((c) => normalize(c) === MANHOUR_HEADERS.jobCode))
  if (headerIndex < 0) throw new Error(`"${sheetName}" has no ${MANHOUR_HEADERS.jobCode} header row.`)

  const header = grid[headerIndex].map(normalize)
  const col = Object.fromEntries(
    (Object.keys(MANHOUR_HEADERS) as Field[]).map((f) => [f, header.indexOf(MANHOUR_HEADERS[f])]),
  ) as Record<Field, number>
  const missing = MANHOUR_REQUIRED.filter((f) => col[f] < 0).map((f) => MANHOUR_HEADERS[f])
  if (missing.length) throw new Error(`"${sheetName}" is missing ${missing.join(', ')}.`)

  const text = (row: Cell[], f: Field) => (col[f] < 0 ? '' : String(row[col[f]] ?? '').trim())
  const entries: ManhourEntry[] = []
  for (const row of grid.slice(headerIndex + 1)) {
    const date = toDateKey(row[col.date])
    const jobCode = text(row, 'jobCode').toUpperCase()
    if (!date || !jobCode) continue
    entries.push({
      date,
      jobCode,
      jobName: text(row, 'jobName'),
      employeeId: text(row, 'employeeId'),
      employeeName: text(row, 'employeeName'),
      workAccount: text(row, 'workAccount').toUpperCase(),
      hours: toHours(row[col.hours]),
      remarks: text(row, 'remarks'),
    })
  }
  return entries
}

/** The month most entries fall in, e.g. "September 2026". */
function dominantMonth(entries: ManhourEntry[]): string {
  const counts = new Map<string, number>()
  for (const e of entries) counts.set(e.date.slice(0, 7), (counts.get(e.date.slice(0, 7)) ?? 0) + 1)
  const top = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (!top) return ''
  const [y, m] = top.split('-').map(Number)
  return MONTH_FORMAT.format(new Date(y, m - 1, 1))
}

/**
 * Reads a monthly manhour export: its Approved and On Route sheets, all jobs. A file with neither
 * sheet but only one sheet (a .csv, say) is read as Approved. Macros in .xlsm files are never run.
 */
export async function readManhourFile(file: File): Promise<ManhourFile> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: false })
  const approvedSheet = findSheet(workbook, MANHOUR_SHEET_NAMES.approved)
  const onRouteSheet = findSheet(workbook, MANHOUR_SHEET_NAMES.onRoute)

  let approved: ManhourEntry[]
  let onRoute: ManhourEntry[] = []
  if (approvedSheet || onRouteSheet) {
    approved = approvedSheet ? readSheet(approvedSheet, MANHOUR_SHEET_NAMES.approved) : []
    onRoute = onRouteSheet ? readSheet(onRouteSheet, MANHOUR_SHEET_NAMES.onRoute) : []
  } else if (workbook.SheetNames.length === 1) {
    approved = readSheet(workbook.Sheets[workbook.SheetNames[0]], workbook.SheetNames[0])
  } else {
    throw new Error(`No "${MANHOUR_SHEET_NAMES.approved}" or "${MANHOUR_SHEET_NAMES.onRoute}" sheet in this file.`)
  }

  if (!approved.length && !onRoute.length) throw new Error('No manhour entries found in this file.')
  return { fileName: file.name, month: dominantMonth([...approved, ...onRoute]), approved, onRoute }
}

/** The report's entries out of a read file: only its job codes, Approved plus On Route gaps. */
export function extractForReport(file: ManhourFile, kind: ReportKind): ImportedSheet {
  const codes = new Set(REPORT_TEMPLATES[kind].jobs.map((j) => j.code))
  const own = (entries: ManhourEntry[]) => entries.filter((e) => codes.has(e.jobCode))
  const merged = mergeManhourSheets(own(file.approved), own(file.onRoute))
  return {
    fileName: file.fileName,
    month: file.month,
    totalRows: file.approved.length + file.onRoute.length,
    ...merged,
  }
}
