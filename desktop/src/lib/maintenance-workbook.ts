import * as XLSX from 'xlsx'
import {
  HOUR_BUCKET_ORDER,
  REPORT_TEMPLATES,
  REQUEST_BUCKET_LABEL,
  REQUEST_STATUS,
  WORKBOOK_LAYOUT as L,
  WORKBOOK_SHEETS as SHEETS,
} from '@/constants/excel-report'
import { activityChartRows, addActivitySeries, MAX_CHART_SERIES } from '@/lib/activity-chart'
import { numToCol, SheetXml } from '@/lib/sheet-xml'
import { readStamps, writeStamps } from '@/lib/sign-off-stamps'
import { XlsxPackage } from '@/lib/xlsx-package'
import type {
  ActivityClass,
  FilledWorkbook,
  GeneratedReport,
  HourBucket,
  ImportedSheet,
  MaintenanceWorkbook,
  SignOff,
  WorkbookActivity,
  WorkbookRequest,
} from '@/types/excel-report'

/** A yearly workbook as imported: its bytes (to fill) and what it already holds (to print). */
export interface LoadedWorkbook {
  fileName: string
  bytes: Uint8Array
  workbook: MaintenanceWorkbook
}

type Cell = string | number | boolean | Date | null | undefined

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

/** Excel date serial → "2026-08-04"; '' when it isn't one. */
function serialToDate(v: Cell): string {
  if (typeof v !== 'number' || v <= 0) return ''
  const d = XLSX.SSF.parse_date_code(v)
  return d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : ''
}

/** "2026-08-04" (or "2026-08", the 1st) → Excel date serial */
function dateToSerial(date: string): number {
  const [y, m, d = 1] = date.split('-').map(Number)
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000
}

/** "September 2026" → "2026-09" */
function monthKey(month: string): string {
  const [name, year] = month.trim().split(/\s+/)
  const m = MONTH_NAMES.indexOf(name.toUpperCase())
  if (m < 0 || !year) throw new Error(`Can't tell which month "${month}" is.`)
  return `${year}-${String(m + 1).padStart(2, '0')}`
}

const text = (v: Cell) => String(v ?? '').trim()
const num = (v: Cell) => (typeof v === 'number' ? v : Number(text(v)) || 0)

/** Rough printed lines of a wrapped cell: the workbooks' description columns fit ~70 capitals. */
const lineCount = (value: string, perLine = 70) => Math.max(1, Math.ceil(value.length / perLine))

function sheetOf(wb: XLSX.WorkBook, name: string): XLSX.WorkSheet {
  const ws = wb.Sheets[name]
  if (!ws) throw new Error(`This isn't a maintenance report workbook: it has no "${name}" sheet.`)
  return ws
}

const valueAt = (ws: XLSX.WorkSheet, col: number, row: number): Cell => ws[`${numToCol(col)}${row}`]?.v
const lastRowOf = (ws: XLSX.WorkSheet) => (ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']).e.r + 1 : 0)

/** Page 2-Graph's title is in A2. */
const GRAPH_TITLE_ROW = 2
/** A graph titled with a month ("JULY 2026 ACTIVITY SUMMARY") shows only that month. */
const MONTHLY_GRAPH = new RegExp(`^(${MONTH_NAMES.join('|')})\\s+\\d{4}\\s+`)

const COL = { B: 2, C: 3, D: 4, F: 6, G: 7, H: 8, I: 9, J: 10, AF: 32, AK: 37, AR: 44, AW: 49 }
const CLASS_COL: Record<ActivityClass, number> = { issue: COL.H, feature: COL.I, support: COL.J }

/** Page 3-Activity's rows that hold an activity: a No. or a description. */
function activityRows(ws: XLSX.WorkSheet): number[] {
  const rows: number[] = []
  for (let r = L.activityFirstRow; r <= lastRowOf(ws); r++)
    if (typeof valueAt(ws, COL.C, r) === 'number' || text(valueAt(ws, COL.D, r))) rows.push(r)
  return rows
}

/** Page 4-Request's filled block header rows: a description with an Investigate row under it. */
function requestBlockRows(ws: XLSX.WorkSheet): number[] {
  const rows: number[] = []
  for (let r = L.requestFirstRow; r <= lastRowOf(ws); r++)
    if (text(valueAt(ws, COL.H, r)) && text(valueAt(ws, COL.H, r + 1)) === REQUEST_BUCKET_LABEL.investigate.trim()) rows.push(r)
  return rows
}

/** Page 4-Request's first column of each fiscal month's 4-column group, by month header. */
function requestMonthCols(ws: XLSX.WorkSheet, months: string[]): (number | null)[] {
  const found = new Map<string, number>()
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  for (let c = 1; c <= range.e.c + 1; c++) {
    const key = serialToDate(valueAt(ws, c, L.requestMonthRow)).slice(0, 7)
    if (key) found.set(key, c)
  }
  return months.map((m) => found.get(m) ?? null)
}

/**
 * Monthly Overview rows: from the first numbered row to the last one above PROGRAMS UPDATES /
 * DECISION. A long overview may be split into boxes by border-only rows, which are included.
 */
function overviewRows(ws: XLSX.WorkSheet): number[] {
  const rows: number[] = []
  for (let r = L.overviewFirstRow; r <= lastRowOf(ws); r++) {
    const rowText = Array.from({ length: 24 }, (_, c) => text(valueAt(ws, c + 1, r))).join(' ').toUpperCase()
    if (rowText.includes('PROGRAMS') || rowText.includes('NO OF DAYS')) break
    if (typeof valueAt(ws, COL.C, r) === 'number') rows.push(r)
  }
  return rows
}

function noOfDaysRow(ws: XLSX.WorkSheet): number | null {
  for (let r = 1; r <= lastRowOf(ws); r++) if (text(valueAt(ws, COL.B, r)).toUpperCase() === 'NO OF DAYS') return r
  return null
}

function readModel(fileName: string, wb: XLSX.WorkBook, pkg: XlsxPackage): MaintenanceWorkbook {
  const hours = sheetOf(wb, SHEETS.hours)
  const months = Array.from({ length: 12 }, (_, i) => serialToDate(valueAt(hours, 4 + i, L.hoursMonthRow)).slice(0, 7))
  if (months.some((m) => !m)) throw new Error(`"${SHEETS.hours}" row ${L.hoursMonthRow} doesn't list the year's 12 months.`)

  const front = sheetOf(wb, SHEETS.front)
  const daysRow = noOfDaysRow(front)

  const activity = sheetOf(wb, SHEETS.activity)
  const graphRows = activityChartRows(pkg)
  const graphed = graphRows ? new Set(graphRows) : null
  let month = ''
  const activities: WorkbookActivity[] = activityRows(activity).map((r) => {
    month = serialToDate(valueAt(activity, COL.B, r)).slice(0, 7) || month
    const flag = (c: number) => num(valueAt(activity, c, r)) > 0
    return {
      month,
      description: text(valueAt(activity, COL.D, r)),
      date: serialToDate(valueAt(activity, COL.F, r)),
      assignedTo: text(valueAt(activity, COL.G, r)),
      classification: flag(COL.H) ? 'issue' : flag(COL.I) ? 'feature' : flag(COL.J) ? 'support' : null,
      inGraph: graphed ? graphed.has(r) : true,
    }
  })

  const request = sheetOf(wb, SHEETS.request)
  const monthCols = requestMonthCols(request, months)
  const requests: WorkbookRequest[] = requestBlockRows(request).map((r) => ({
    date: serialToDate(valueAt(request, COL.AF, r)),
    description: text(valueAt(request, COL.H, r)),
    reqPerson: text(valueAt(request, COL.AK, r)),
    status: text(valueAt(request, COL.AR, r)),
    hours: Object.fromEntries(
      HOUR_BUCKET_ORDER.map((b, k) => [b, monthCols.map((c) => (c === null ? 0 : num(valueAt(request, c, r + 1 + k))))]),
    ) as Record<HourBucket, number[]>,
  }))

  return {
    fileName,
    months,
    hoursTitle: text(valueAt(hours, 1, 1)),
    plan: months.map((_, i) => num(valueAt(hours, 4 + i, L.hoursPlanRow))),
    title: text(front[L.frontTitle]?.v),
    overview: overviewRows(front).map((r) => text(valueAt(front, COL.D, r))),
    workingDays: daysRow ? num(valueAt(front, COL.B, daysRow + 1)) : null,
    graphTitle: text(valueAt(sheetOf(wb, SHEETS.graph), 1, GRAPH_TITLE_ROW)),
    stamps: readStamps(pkg),
    activities,
    requests,
  }
}

/** Mirrors addActivitySeries: past the series limit, the oldest graphed activities drop off. */
function keepGraphLimit(activities: WorkbookActivity[]): WorkbookActivity[] {
  let extra = activities.filter((a) => a.inGraph).length - MAX_CHART_SERIES
  return activities.map((a) => (a.inGraph && extra-- > 0 ? { ...a, inGraph: false } : a))
}

/** Every person's initials already in Page 3-Activity's Assigned To ("RNM/JBF/JGA/LJT" → 4). */
function knownInitials(workbook: MaintenanceWorkbook): string[] {
  return [...new Set(workbook.activities.flatMap((a) => a.assignedTo.split('/')).map((i) => i.trim()).filter((i) => /^[A-Z]{2,4}$/.test(i)))]
}

/**
 * The export only has some employees' first and last names ("LEMUEL TEDRA" → LT) while the
 * workbook uses their middle initial too (LJT): the one known person with the same first and last
 * letter, when there is exactly one, is used.
 */
function matchInitials(initials: string, known: string[]): string {
  if (known.includes(initials) || initials.length < 2) return initials
  const same = known.filter((k) => k.length > initials.length && k[0] === initials[0] && k[k.length - 1] === initials[initials.length - 1])
  return same.length === 1 ? same[0] : initials
}

/**
 * Reads last month's yearly maintenance workbook (.xlsm or .xlsx): its fiscal months, plan, and every
 * activity and request already in it. Macros are never run.
 */
export async function readMaintenanceWorkbook(file: File): Promise<LoadedWorkbook> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const wb = XLSX.read(bytes, { type: 'array' })
  return { fileName: file.name, bytes, workbook: readModel(file.name, wb, XlsxPackage.read(bytes)) }
}

/** The fiscal month index of the report's month in this workbook, or why it can't be added. */
export function monthIndexFor(workbook: MaintenanceWorkbook, month: string): number {
  const key = monthKey(month)
  const index = workbook.months.indexOf(key)
  if (index < 0)
    throw new Error(`${workbook.fileName} covers ${workbook.months[0]} to ${workbook.months[11]}; ${month} isn't in it.`)
  const hasHours = workbook.requests.some((r) => HOUR_BUCKET_ORDER.some((b) => r.hours[b][index] > 0))
  if (hasHours || workbook.activities.some((a) => a.month === key))
    throw new Error(`${month} is already in ${workbook.fileName}. Import the workbook from before it was added.`)
  return index
}

/**
 * Writes the report's month into the yearly workbook, the way it is filled by hand:
 * - Monthly Maintenance Report: the month's title, Monthly Overview and No. of days;
 * - Page 3-Activity: one row per request under a new month group;
 * - Page 4-Request: one block per request, its hours in the month's column;
 * - Page 5- Data and Support hours: the month's counts and actual hours (formulas, as in the sheet).
 * - Page 2-Graph: a cylinder band per new activity;
 * - the sign-off stamps: dated today, with the supervisor and preparer initials (see SignOff).
 * Charts, macros and every earlier month are kept as they are.
 */
export function fillWorkbook(
  loaded: LoadedWorkbook,
  report: GeneratedReport,
  sheet: ImportedSheet,
  signOff: SignOff,
): FilledWorkbook {
  const { workbook } = loaded
  const index = monthIndexFor(workbook, sheet.month)
  const key = workbook.months[index]
  const known = knownInitials(workbook)
  const requests = [...report.requests]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ ...r, assignedTo: r.assignedTo.split('/').map((i) => matchInitials(i, known)).join('/') }))
  if (!requests.length) throw new Error(`There are no ${report.kind} requests with hours in ${sheet.month}.`)

  const wb = XLSX.read(loaded.bytes, { type: 'array' })
  const pkg = XlsxPackage.read(loaded.bytes)
  const edit = (name: string, fn: (xml: SheetXml, path: string) => void) => {
    const path = pkg.sheetPath(name)
    const xml = new SheetXml(pkg.text(path))
    fn(xml, path)
    pkg.setText(path, xml.toString())
  }

  // Page 3-Activity: the month's rows after the last activity, styled like the last month group.
  const activity = sheetOf(wb, SHEETS.activity)
  const filled = activityRows(activity)
  const lastActivity = filled[filled.length - 1] ?? L.activityFirstRow - 1
  const groupStart = [...filled].reverse().find((r) => typeof valueAt(activity, COL.B, r) === 'number') ?? lastActivity
  const lastNo = num(valueAt(activity, COL.C, lastActivity))
  const firstNew = lastActivity + 1
  const lastNew = lastActivity + requests.length

  edit(SHEETS.activity, (xml) => {
    xml.removeMergesInRows(firstNew, lastNew)
    requests.forEach((req, i) => {
      const r = firstNew + i
      const template = i === 0 ? groupStart : i === requests.length - 1 ? lastActivity : Math.max(groupStart, lastActivity - 1)
      xml.copyRowStyle(template, r)
      if (i === 0) xml.set(`B${r}`, { number: dateToSerial(key) })
      xml.set(`C${r}`, { number: lastNo + 1 + i })
      xml.set(`D${r}`, { text: req.description })
      xml.set(`F${r}`, { number: dateToSerial(req.date) })
      xml.set(`G${r}`, { text: req.assignedTo })
      for (const c of Object.values(CLASS_COL)) xml.set(`${numToCol(c)}${r}`, { empty: true })
      xml.set(`${numToCol(CLASS_COL[req.classification])}${r}`, { number: 1 })
      const lines = lineCount(req.description)
      xml.setRowHeight(r, lines > 1 ? Math.round(lines * 14.45 * 100) / 100 : null)
    })
    if (requests.length > 1) xml.addMerge(`B${firstNew}:B${lastNew}`)
  })
  pkg.setPrintAreaLastRow(SHEETS.activity, Math.max(pkg.printAreaLastRow(SHEETS.activity) ?? 0, lastNew + 2))

  // Page 5- Data: the month's Issues / Feature(s) / Support(s), summed from its Page 3 rows.
  const data = sheetOf(wb, SHEETS.data)
  const monthOfYear = Number(key.slice(5))
  const dataRow =
    Array.from({ length: 12 }, (_, i) => L.dataFirstRow + i).find(
      (r) => Number(serialToDate(valueAt(data, COL.B, r)).slice(5, 7)) === monthOfYear,
    ) ?? L.dataFirstRow + index
  edit(SHEETS.data, (xml) => {
    // The month labels are the fiscal year's (the template's kept last year's).
    workbook.months.forEach((m, i) => {
      const r = dataRow - index + i
      if (r >= L.dataFirstRow && r < L.dataFirstRow + 12) xml.set(`B${r}`, { number: dateToSerial(m) })
    })
    ;(['issue', 'feature', 'support'] as ActivityClass[]).forEach((cls, k) => {
      const src = numToCol(CLASS_COL[cls])
      xml.set(`${numToCol(3 + k)}${dataRow}`, {
        formula: `SUM('${SHEETS.activity}'!${src}${firstNew}:${src}${lastNew})`,
        cached: requests.filter((r) => r.classification === cls).length,
      })
    })
  })

  // Page 4-Request: a block per request after the last filled one (over any empty pre-made blocks).
  const request = sheetOf(wb, SHEETS.request)
  const monthCols = requestMonthCols(request, workbook.months)
  const monthCol = monthCols[index]
  if (monthCol === null) throw new Error(`"${SHEETS.request}" has no ${key} column.`)
  const blocks = requestBlockRows(request)
  const template = blocks[blocks.length - 1]
  if (!template) throw new Error(`"${SHEETS.request}" has no request block to copy the layout from.`)
  const step = L.requestBlockRows
  const reqPerson = REPORT_TEMPLATES[report.kind].reqPerson ?? ''
  const lastBlockRow = template + step * requests.length + HOUR_BUCKET_ORDER.length

  edit(SHEETS.request, (xml) => {
    requests.forEach((req, i) => {
      const h = template + step * (i + 1)
      const act = firstNew + i
      xml.removeMergesInRows(h, h + step - 1)
      for (let k = 0; k < step; k++) {
        if (xml.hasRow(template + k)) xml.copyRowStyle(template + k, h + k)
        else xml.deleteRow(h + k)
      }
      xml.copyMerges(template, step, h)

      const serial = dateToSerial(req.date)
      xml.set(`B${h}`, { formula: `AF${h}`, cached: serial })
      xml.set(`H${h}`, { formula: `'${SHEETS.activity}'!D${act}`, cached: req.description })
      xml.set(`AF${h}`, { formula: `'${SHEETS.activity}'!F${act}`, cached: serial })
      xml.set(`AR${h}`, { text: REQUEST_STATUS })
      if (reqPerson) xml.set(`AK${h}`, { text: reqPerson })
      xml.set(`AW${h}`, { formula: `SUM(BE${h + 1}:XFD${h + 4})`, cached: req.total })
      HOUR_BUCKET_ORDER.forEach((bucket, k) => {
        const r = h + 1 + k
        const code = `${req.date.slice(5, 7)}${req.date.slice(8, 10)}-0${k + 1}`
        xml.set(`B${r}`, { formula: `TEXT(B${h}, "mm") & TEXT(B${h}, "DD") & "-0${k + 1}"`, cached: code })
        xml.set(`H${r}`, { text: REQUEST_BUCKET_LABEL[bucket] })
        xml.set(`AR${r}`, { text: REQUEST_STATUS })
        if (req.split[bucket] > 0) xml.set(`${numToCol(monthCol)}${r}`, { number: req.split[bucket] })
      })
    })

    // A printed page holds 8 blocks; continue the sheet's page breaks past the new blocks.
    const breaks = xml.rowBreaks
    let last = breaks.length ? Math.max(...breaks) : L.requestFirstRow - 1
    const added: number[] = []
    while (last + L.requestRowsPerPage < lastBlockRow) added.push((last += L.requestRowsPerPage))
    if (added.length) xml.addRowBreaks(added, XLSX.utils.decode_range(request['!ref'] ?? 'A1').e.c + 1)
  })
  pkg.setPrintAreaLastRow(SHEETS.request, Math.max(pkg.printAreaLastRow(SHEETS.request) ?? 0, lastBlockRow))

  // Support hours → Actual: each month reads its own Page 4-Request total (the template's later
  // months pointed at the wrong columns).
  const actual = workbook.months.map((_, i) =>
    workbook.requests.reduce((s, r) => s + HOUR_BUCKET_ORDER.reduce((t, b) => t + r.hours[b][i], 0), 0) +
    (i === index ? requests.reduce((s, r) => s + r.total, 0) : 0),
  )
  edit(SHEETS.hours, (xml) => {
    monthCols.forEach((c, i) => {
      if (c === null) return
      xml.set(`${numToCol(4 + i)}${L.hoursActualRow}`, {
        formula: `'${SHEETS.request}'!${numToCol(c)}${L.requestTotalRow}`,
        cached: actual[i],
      })
    })
  })

  // Monthly Maintenance Report: title, Monthly Overview (rows added or removed to fit), No. of days.
  const front = sheetOf(wb, SHEETS.front)
  const oldRows = overviewRows(front)
  if (!oldRows.length) throw new Error(`"${SHEETS.front}" has no Monthly Overview rows to copy the layout from.`)
  const overview = report.overview.map((item) => item.original.toUpperCase())
  const first = L.overviewFirstRow
  const oldEnd = oldRows[oldRows.length - 1] ?? first
  const delta = overview.length - (oldEnd - first + 1)
  const daysRow = noOfDaysRow(front)
  const monthName = MONTH_NAMES[monthOfYear - 1]
  const oldTitle = text(front[L.frontTitle]?.v)
  const title = new RegExp(`^(${MONTH_NAMES.join('|')})\\b`).test(oldTitle)
    ? oldTitle.replace(new RegExp(`^(${MONTH_NAMES.join('|')})`), monthName)
    : report.title

  edit(SHEETS.front, (xml, path) => {
    xml.set(L.frontTitle, { text: title })
    const lineStyle = xml.rowStyle(first)
    for (let r = first; r <= oldEnd; r++) xml.deleteRow(r)
    xml.removeMergesInRows(first, oldEnd)
    xml.removeRowBreaks(first, oldEnd)
    xml.shiftRows(oldEnd + 1, delta)
    overview.forEach((line, i) => {
      const r = first + i
      xml.copyRowStyle(lineStyle, r)
      xml.set(`C${r}`, { number: i + 1 })
      xml.set(`D${r}`, { text: line })
      xml.addMerge(`D${r}:W${r}`)
      const lines = lineCount(line)
      xml.setRowHeight(r, lines > 1 ? Math.round(lines * 17.4 * 100) / 100 : 21)
    })
    if (daysRow) xml.set(`B${daysRow + delta + 1}`, { number: report.workingDays })

    // The stamps and text boxes below the overview move with it.
    const drawing = pkg.drawingOf(path)
    if (drawing && delta)
      pkg.setText(
        drawing,
        pkg.text(drawing).replace(/<xdr:row>(\d+)<\/xdr:row>/g, (whole, row: string) =>
          Number(row) >= oldEnd ? `<xdr:row>${Number(row) + delta}</xdr:row>` : whole,
        ),
      )
  })
  const frontEnd = pkg.printAreaLastRow(SHEETS.front)
  if (frontEnd) pkg.setPrintAreaLastRow(SHEETS.front, frontEnd + delta)

  // Sign-off stamps: all dated today; supervisor first, the preparer second, the third keeps its initials.
  const stamps = workbook.stamps.map((s, i) => ({
    ...s,
    date: signOff.date,
    initials: i === 0 ? signOff.supervisor : i === 1 ? signOff.preparedBy : s.initials,
  }))
  writeStamps(pkg, stamps)

  // Page 2-Graph: a cylinder band per new activity row; a monthly graph shows only the new month.
  const monthly = MONTHLY_GRAPH.test(workbook.graphTitle)
  const graphTitle = monthly
    ? workbook.graphTitle.replace(MONTHLY_GRAPH, `${monthName} ${key.slice(0, 4)} `)
    : workbook.graphTitle
  if (monthly) edit(SHEETS.graph, (xml) => xml.set(`A${GRAPH_TITLE_ROW}`, { text: graphTitle }))
  const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  addActivitySeries(
    pkg,
    requests.map((r, i) => ({
      row: firstNew + i,
      description: r.description,
      dateLabel: `${Number(r.date.slice(8, 10))}-${SHORT[Number(r.date.slice(5, 7)) - 1]}`,
      assignedTo: r.assignedTo,
      classification: r.classification,
    })),
    monthly,
  )

  pkg.recalculateOnOpen()

  const monthHours = (bucket: HourBucket, split: Record<HourBucket, number>) =>
    workbook.months.map((_, i) => (i === index ? split[bucket] : 0))
  return {
    bytes: pkg.bytes(),
    workbook: {
      ...workbook,
      title,
      overview,
      workingDays: report.workingDays,
      stamps,
      graphTitle,
      activities: keepGraphLimit([
        ...workbook.activities.map((a) => (monthly ? { ...a, inGraph: false } : a)),
        ...requests.map((r) => ({
          month: key,
          description: r.description,
          date: r.date,
          assignedTo: r.assignedTo,
          classification: r.classification,
          inGraph: true,
        })),
      ]),
      requests: [
        ...workbook.requests,
        ...requests.map((r) => ({
          date: r.date,
          description: r.description,
          reqPerson,
          status: REQUEST_STATUS,
          hours: Object.fromEntries(HOUR_BUCKET_ORDER.map((b) => [b, monthHours(b, r.split)])) as Record<HourBucket, number[]>,
        })),
      ],
    },
  }
}
