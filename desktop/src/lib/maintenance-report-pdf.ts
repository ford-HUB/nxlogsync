import { jsPDF } from 'jspdf'
import autoTable, { type RowInput } from 'jspdf-autotable'
import {
  HOUR_BUCKET_LABEL,
  HOUR_BUCKET_ORDER,
  WORKBOOK_SHEETS as SHEETS,
} from '@/constants/excel-report'
import type { ActivityClass, MaintenanceWorkbook, SignOffStamp, WorkbookRequest } from '@/types/excel-report'

type Doc = jsPDF & { lastAutoTable: { finalY: number } }
type Rgb = [number, number, number]

/** The workbook's colours: title bars, the chart series, the Programs label, Page 5's header band. */
const GREY: Rgb = [191, 191, 191]
const DARK_GREY: Rgb = [128, 128, 128]
const PLAN_BLUE: Rgb = [68, 114, 196]
const ACTUAL_RED: Rgb = [192, 80, 77]
const PROGRAMS_GREEN: Rgb = [0, 255, 0]
const STAMP_RED: Rgb = [255, 0, 0]
const DATA_ORANGE: Rgb = [250, 191, 143]
const BLOCK_ORANGE: Rgb = [250, 191, 143]

const CLASSES: ActivityClass[] = ['issue', 'feature', 'support']
/** Page 2-Graph's axis labels. */
const GRAPH_LABEL: Record<ActivityClass, string> = { issue: 'Issue(s)', feature: 'Feature(s)', support: 'Support(s)' }
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Page 3-Activity rows one Month cell spans at most. */
const ACTIVITY_MONTH_CHUNK = 12
/** Page 4-Request blocks per printed page. */
const BLOCKS_PER_PAGE = 7

/** "2026-09" → "Sep-26" */
const monthLabel = (key: string) => `${MONTHS_SHORT[Number(key.slice(5, 7)) - 1]}-${key.slice(2, 4)}`
/** "2026-09-04" → "4-Sep" */
const dayLabel = (date: string) => (date ? `${Number(date.slice(8, 10))}-${MONTHS_SHORT[Number(date.slice(5, 7)) - 1]}` : '')
/** "2026-09-04" → "9/4/2026" */
const usDate = (date: string) => (date ? `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}/${date.slice(0, 4)}` : '')
/** The workbook's accounting format: 1,785.50 · (32.50) · - */
const accounting = (n: number) =>
  n === 0 ? '-' : n < 0 ? `(${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hours = (n: number) => (n ? String(n) : '')

/** jsPDF's built-in fonts only cover Latin-1. */
const pdfText = (text: string) => text.replace(/…/g, '...').replace(/[–—]/g, '-').replace(/→/g, '->').replace(/[^\x20-\xff]/g, '')

const requestTotal = (r: WorkbookRequest) => HOUR_BUCKET_ORDER.reduce((s, b) => s + r.hours[b].reduce((t, h) => t + h, 0), 0)

function titleBar(doc: Doc, text: string, x: number, y: number, w: number, h: number, opts: { align?: 'left' | 'center'; size?: number; fill?: Rgb } = {}) {
  doc.setFillColor(...(opts.fill ?? GREY)).rect(x, y, w, h, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(opts.size ?? 14).setTextColor(0)
  const tx = opts.align === 'left' ? x + 6 : x + w / 2
  doc.text(text, tx, y + h / 2, { align: opts.align === 'left' ? 'left' : 'center', baseline: 'middle' })
}

/** A red N-PAX sign-off stamp as the workbook draws it: an oval with the label, date and initials. */
function stamp(doc: Doc, { label, date, initials }: SignOffStamp, cx: number, cy: number, rx: number, ry: number) {
  doc.setDrawColor(...STAMP_RED).setTextColor(...STAMP_RED).setLineWidth(1.4)
  doc.ellipse(cx, cy, rx, ry, 'S')
  // Label, rule, date, rule, initials, on alphabetic baselines (9pt bold capitals are ~6.5pt tall).
  const rule = (dy: number) => {
    const half = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)) - 1
    doc.setLineWidth(0.9).line(cx - half, cy + dy, cx + half, cy + dy)
  }
  doc.setFont('helvetica', 'bold').setFontSize(9)
  doc.text(pdfText(label), cx, cy - 10, { align: 'center' })
  rule(-7)
  doc.text(pdfText(date), cx, cy + 3.3, { align: 'center' })
  rule(6.5)
  doc.text(pdfText(initials), cx, cy + 16.5, { align: 'center' })
  doc.setDrawColor(0).setTextColor(0)
}

/** Monthly Maintenance Report: title, Monthly Overview, Programs Updates / Decision, No. of days and sign-offs. */
function frontPage(doc: Doc, wb: MaintenanceWorkbook) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const outerX = 70
  const outerW = pageW - outerX * 2
  const innerX = outerX + 18
  const innerW = outerW - 36
  const bottom = pageH - 60
  let pageTop = 70

  doc.setDrawColor(0).setLineWidth(1.6)
  const outer = (top: number, end: number, closeTop: boolean, closeBottom: boolean) => {
    doc.setLineWidth(1.6)
    doc.line(outerX, top, outerX, end).line(outerX + outerW, top, outerX + outerW, end)
    if (closeTop) doc.line(outerX, top, outerX + outerW, top)
    if (closeBottom) doc.line(outerX, end, outerX + outerW, end)
  }

  let y = pageTop + 14
  doc.setLineWidth(0.8)
  titleBar(doc, pdfText(wb.title), innerX, y, innerW, 26, { size: 13 })
  doc.rect(innerX, y, innerW, 26)
  y += 50

  // Monthly Overview box; it continues on the next page when the list is long.
  let boxTop = y
  y += 22
  doc.setFont('helvetica', 'normal').setFontSize(9).text('Monthly Overview', innerX + 22, y)
  y += 11
  doc.text('These are the list of sent and for deployment updates:', innerX + 22, y)
  y += 18
  const textX = innerX + 44
  const textW = innerW - 60
  let firstPage = true
  wb.overview.forEach((item, i) => {
    const lines = doc.setFontSize(8.5).splitTextToSize(pdfText(item), textW) as string[]
    const h = lines.length * 10.5 + 3
    if (y + h > bottom) {
      doc.setLineWidth(0.8).line(innerX, boxTop, innerX, y).line(innerX + innerW, boxTop, innerX + innerW, y)
      if (boxTop !== pageTop) doc.line(innerX, boxTop, innerX + innerW, boxTop)
      outer(pageTop, y + 8, firstPage, false)
      firstPage = false
      doc.addPage('a4', 'portrait')
      pageTop = 50
      boxTop = pageTop
      y = pageTop + 16
    }
    doc.setFont('helvetica', 'bold').text(String(i + 1), textX - 4, y, { align: 'right' })
    doc.setFont('helvetica', 'normal').text(lines, textX, y)
    y += h
  })
  y += 8
  doc.setLineWidth(0.8).rect(innerX, boxTop, innerW, y - boxTop)
  if (!firstPage) doc.setDrawColor(255).line(innerX + 0.5, boxTop, innerX + innerW - 0.5, boxTop).setDrawColor(0)

  // The sign-off area stays together.
  const tail = 30 + 118 + 18 + 52 + 22
  if (y + tail > bottom + 30) {
    outer(pageTop, y + 8, firstPage, false)
    firstPage = false
    doc.addPage('a4', 'portrait')
    pageTop = 50
    y = pageTop
  }
  y += 22
  titleBar(doc, 'PROGRAMS  UPDATES / DECISION', innerX + innerW * 0.15, y, innerW * 0.7, 16, { size: 10, fill: PROGRAMS_GREEN })
  y += 16
  doc.setLineWidth(0.8).rect(innerX, y, innerW / 2, 118).rect(innerX + innerW / 2, y, innerW / 2, 118)
  y += 118 + 16

  const boxW = (innerW - 3 * 26) / 4
  for (let k = 0; k < 4; k++) {
    const bx = innerX + k * (boxW + 26)
    doc.setLineWidth(0.8).rect(bx, y, boxW, 12).rect(bx, y + 12, boxW, 40)
    if (k === 0) {
      doc.setFont('helvetica', 'bold').setFontSize(7.5).text('NO OF DAYS', bx + boxW / 2, y + 8.5, { align: 'center' })
      doc.setFont('helvetica', 'normal').setFontSize(18).text(wb.workingDays === null ? '' : String(wb.workingDays), bx + boxW / 2, y + 38, { align: 'center' })
    } else if (wb.stamps[k - 1]) {
      stamp(doc, wb.stamps[k - 1], bx + boxW / 2, y + 27, boxW * 0.4, 25)
    }
  }
  y += 52 + 22
  outer(pageTop, y, firstPage, true)
}

/** Support hours: the year's Plan against Actual as a line chart and a table. */
function hoursPage(doc: Doc, wb: MaintenanceWorkbook, actual: number[]) {
  doc.addPage('a4', 'landscape')
  const pageW = doc.internal.pageSize.getWidth()
  const x = 50
  const w = pageW - 100
  titleBar(doc, pdfText(wb.hoursTitle || 'MAINTENANCE HOURS'), x, 52, w, 26)

  // Chart
  const cTop = 92
  const cH = 330
  doc.setDrawColor(217).setLineWidth(0.6).rect(x, cTop, w, cH)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(89).text('MAINTENANCE HOURS', x + w / 2, cTop + 16, { align: 'center' })
  const max = Math.max(250, Math.ceil(Math.max(...wb.plan, ...actual) / 50) * 50)
  const px = x + 36
  const pw = w - 50
  const py = cTop + 30
  const ph = cH - 80
  const yOf = (v: number) => py + ph - (v / max) * ph
  doc.setFontSize(7).setTextColor(89)
  for (let v = 0; v <= max; v += 50) {
    doc.setDrawColor(217).setLineWidth(0.5).line(px, yOf(v), px + pw, yOf(v))
    doc.text(String(v), px - 6, yOf(v), { align: 'right', baseline: 'middle' })
  }
  const step = pw / wb.months.length
  const xOf = (i: number) => px + step * (i + 0.5)
  wb.months.forEach((m, i) => doc.text(monthLabel(m), xOf(i), py + ph + 12, { align: 'center' }))
  const series = (values: number[], colour: Rgb) => {
    doc.setDrawColor(...colour).setFillColor(...colour).setLineWidth(1.6)
    values.forEach((v, i) => i && doc.line(xOf(i - 1), yOf(values[i - 1]), xOf(i), yOf(v)))
    values.forEach((v, i) => doc.circle(xOf(i), yOf(v), 2.2, 'F'))
  }
  series(wb.plan, PLAN_BLUE)
  series(actual, ACTUAL_RED)
  const ly = cTop + cH - 14
  ;[
    ['Plan', PLAN_BLUE],
    ['Actual', ACTUAL_RED],
  ].forEach(([label, colour], k) => {
    const lx = x + w / 2 - 50 + k * 56
    doc.setDrawColor(...(colour as Rgb)).setFillColor(...(colour as Rgb)).setLineWidth(1.6).line(lx, ly, lx + 16, ly).circle(lx + 8, ly, 2, 'F')
    doc.setTextColor(89).text(label as string, lx + 20, ly, { baseline: 'middle' })
  })
  doc.setTextColor(0).setDrawColor(0)

  const total = (v: number[]) => v.reduce((s, n) => s + n, 0)
  const variance = wb.plan.map((p, i) => p - actual[i])
  autoTable(doc, {
    startY: cTop + cH + 22,
    margin: { left: x, right: x },
    head: [['', 'TOTAL', ...wb.months.map(monthLabel)]],
    body: [
      ['Plan', accounting(total(wb.plan)), ...wb.plan.map(String)],
      ['Actual', accounting(total(actual)), ...actual.map(accounting)],
      ['Variance', accounting(total(variance)), ...variance.map(accounting)],
    ],
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'right', textColor: 0, lineColor: 0, lineWidth: 0.5 },
    headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 56 } },
    didParseCell: (d) => {
      if (d.section === 'body' && d.row.index === 2 && d.column.index > 1) d.cell.styles.fontStyle = 'bold'
    },
  })
}

/**
 * Excel's automatic series colours for chart style 2: the six theme accents, then the same accents
 * darker, then lighter, and so on.
 */
const ACCENTS: Rgb[] = [
  [79, 129, 189], [192, 80, 77], [155, 187, 89], [128, 100, 162], [75, 172, 198], [247, 150, 70],
]
const SERIES_VARIANTS = [1, 0.78, 1.35, 0.88, 1.6, 1.18]
const shade = ([r, g, b]: Rgb, f: number): Rgb =>
  (f <= 1 ? [r * f, g * f, b * f] : [r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)]).map(
    (v) => Math.round(Math.min(255, Math.max(0, v))),
  ) as Rgb
const seriesColour = (i: number) => shade(ACCENTS[i % 6], SERIES_VARIANTS[Math.floor(i / 6) % SERIES_VARIANTS.length])

const FLOOR_TAN: Rgb = [196, 189, 151]
const GRID_GREY: Rgb = [134, 134, 134]

/**
 * Page 2-Graph as the workbook draws it: a 3-D stacked cylinder chart (0 to 110 by 10) where each
 * Page 3-Activity row is one band on its Issue(s), Feature(s) or Support(s) cylinder, in row order
 * from the floor up, over a grey back and side wall and a tan floor.
 */
function graphPage(doc: Doc, wb: MaintenanceWorkbook) {
  doc.addPage('a4', 'landscape')
  const pageW = doc.internal.pageSize.getWidth()
  titleBar(doc, pdfText(wb.graphTitle || 'ACTIVITY SUMMARY'), 120, 52, pageW - 300, 32)

  // Oblique 3-D: the back wall sits up and to the right of the front plane by the depth offset.
  const px = 175
  const pw = pageW - 340
  const floorY = 470
  const ph = 320
  const depthX = 55
  const depthY = 28
  const totals = CLASSES.map((c) => wb.activities.filter((a) => a.classification === c && a.inGraph).length)
  const max = Math.max(110, Math.ceil(Math.max(...totals) / 10) * 10)
  const yOf = (v: number) => floorY - (v / max) * ph

  doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(0)
  for (let v = 0; v <= max; v += 10) {
    const y = yOf(v)
    doc.setDrawColor(...GRID_GREY).setLineWidth(0.6)
    doc.line(px, y, px + depthX, y - depthY).line(px + depthX, y - depthY, px + depthX + pw, y - depthY)
    doc.setDrawColor(0).line(px - 3, y, px, y)
    doc.text(String(v), px - 6, y, { align: 'right', baseline: 'middle' })
  }
  doc.setDrawColor(...GRID_GREY).line(px, yOf(0), px, yOf(max))

  // Floor
  doc.setFillColor(...FLOOR_TAN).setDrawColor(...GRID_GREY).setLineWidth(0.8)
  doc.lines(
    [
      [pw, 0],
      [depthX, -depthY],
      [-pw, 0],
    ],
    px,
    floorY,
    [1, 1],
    'FD',
    true,
  )

  // Cylinders: one band per activity, in Page 3 order, standing mid-depth on the floor.
  // Colours follow the chart's series order, which starts at the first graphed activity.
  const seriesIndex = new Map<number, number>()
  wb.activities.forEach((a, i) => a.inGraph && seriesIndex.set(i, seriesIndex.size))
  const slot = pw / CLASSES.length
  const rx = slot * 0.17
  const ry = rx * 0.22
  CLASSES.forEach((c, k) => {
    const cx = px + slot * k + slot / 2 + depthX / 2
    const base = floorY - depthY / 2
    const bandOf = (v: number) => base - (v / max) * ph
    let level = 0
    let top: Rgb | null = null
    wb.activities.forEach((a, i) => {
      if (a.classification !== c || !a.inGraph) return
      const colour = seriesColour(seriesIndex.get(i) ?? i)
      const y0 = bandOf(level)
      const y1 = bandOf(level + 1)
      doc.setFillColor(...shade(colour, 0.8)).ellipse(cx, y0, rx, ry, 'F')
      doc.setFillColor(...colour).rect(cx - rx, y1, rx * 2, y0 - y1, 'F')
      // Shading toward the right edge, as the rendered cylinder is lit from the left.
      doc.setFillColor(...shade(colour, 0.78)).rect(cx + rx * 0.45, y1, rx * 0.55, y0 - y1, 'F')
      doc.setFillColor(...shade(colour, 1.25)).rect(cx - rx * 0.7, y1, rx * 0.3, y0 - y1, 'F')
      level += 1
      top = colour
    })
    if (top) doc.setFillColor(...shade(top, 1.35)).ellipse(cx, bandOf(level), rx, ry, 'F')
    doc.setFontSize(8).setTextColor(0).text(GRAPH_LABEL[c], px + slot * k + slot / 2, floorY + 22, { align: 'center' })
  })
  doc.setDrawColor(0)
}

/** Page 3-Activity: every activity of the year under its month, with its classification. */
function activityPage(doc: Doc, wb: MaintenanceWorkbook) {
  doc.addPage('a4', 'landscape')
  const pageW = doc.internal.pageSize.getWidth()
  const x = 40
  titleBar(doc, 'MONTHLY ACTIVITY REPORT', x, 50, pageW - 2 * x, 28)

  // The Month cell spans its rows in chunks of at most ACTIVITY_MONTH_CHUNK, label repeated, as the
  // FEP workbook does: a span taller than a page can't be drawn.
  const chunkStarts = new Map<number, number>()
  wb.activities.forEach((a, i) => {
    let end = i
    while (end < wb.activities.length && wb.activities[end].month === a.month) end++
    if (i === 0 || wb.activities[i - 1].month !== a.month)
      for (let start = i; start < end; start += ACTIVITY_MONTH_CHUNK) chunkStarts.set(start, Math.min(ACTIVITY_MONTH_CHUNK, end - start))
  })

  const body: RowInput[] = []
  wb.activities.forEach((a, i) => {
    const span = chunkStarts.get(i)
    const row: RowInput = [
      { content: String(i + 1), styles: { halign: 'center' } },
      pdfText(a.description),
      { content: dayLabel(a.date), styles: { halign: 'center' } },
      { content: a.assignedTo, styles: { halign: 'center' } },
      ...CLASSES.map((c) => ({ content: a.classification === c ? '1' : '', styles: { halign: 'center' as const } })),
      '',
      '',
      '',
    ]
    if (span)
      row.unshift({
        content: a.month ? monthLabel(a.month) : '',
        rowSpan: span,
        styles: { valign: 'middle', halign: 'center' },
      })
    body.push(row)
  })

  autoTable(doc, {
    startY: 92,
    margin: { left: x, right: x, top: 92 },
    // Excel repeats the title rows on every printed page.
    willDrawPage: (d) => {
      if (d.pageNumber > 1) titleBar(doc, 'MONTHLY ACTIVITY REPORT', x, 50, pageW - 2 * x, 28)
    },
    head: [
      [
        { content: 'Month', rowSpan: 2 },
        { content: 'No.', rowSpan: 2 },
        { content: 'Activity Description', rowSpan: 2 },
        { content: 'Date Reported /Started', rowSpan: 2 },
        { content: 'Assigned To', rowSpan: 2 },
        { content: 'Classification', colSpan: 3 },
        { content: 'Severity Level', colSpan: 3 },
      ],
      ['Issues', 'Feature(s)', 'Support(s)', 'Easy', 'Normal', 'Hard'],
    ],
    body,
    theme: 'grid',
    rowPageBreak: 'avoid',
    styles: { fontSize: 7, cellPadding: 1.8, textColor: 0, lineColor: 0, lineWidth: 0.5, valign: 'middle' },
    headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 26 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 50 },
      4: { cellWidth: 70 },
      5: { cellWidth: 40 },
      6: { cellWidth: 46 },
      7: { cellWidth: 46 },
      8: { cellWidth: 40 },
      9: { cellWidth: 40 },
      10: { cellWidth: 40 },
    },
  })
}

/** Page 4-Request: each request's block (header and its four hour rows), hours by month. */
function requestPages(doc: Doc, wb: MaintenanceWorkbook, actual: number[]) {
  const months = wb.months.map(monthLabel)
  const head: RowInput[] = [
    ['No.', 'Request / Fixing Description', 'Req. Date', 'Req Person', 'Status', 'Total(H)', ...months],
    [
      { content: 'Total', colSpan: 5, styles: { halign: 'center' } },
      { content: actual.reduce((s, n) => s + n, 0).toFixed(2) },
      ...actual.map((n) => String(n)),
    ],
  ]
  const monthCells = (values: number[], fill?: Rgb) =>
    values.map((v) => ({ content: hours(v), styles: fill ? { fillColor: fill } : {} }))

  for (let start = 0; start < Math.max(1, wb.requests.length); start += BLOCKS_PER_PAGE) {
    doc.addPage('a4', 'landscape')
    const pageW = doc.internal.pageSize.getWidth()
    const x = 36
    titleBar(doc, 'ACTIVITY DESCRIPTION', x, 46, pageW - 2 * x, 30, { align: 'left', size: 18 })

    const body: RowInput[] = []
    wb.requests.slice(start, start + BLOCKS_PER_PAGE).forEach((req, b) => {
      if (b) body.push([{ content: '', colSpan: 6 + months.length, styles: { lineWidth: 0, minCellHeight: 8 } }])
      const code = `${req.date.slice(5, 7)}${req.date.slice(8, 10)}`
      body.push([
        { content: req.date, styles: { fontStyle: 'bold', fillColor: BLOCK_ORANGE } },
        { content: pdfText(req.description), styles: { fontStyle: 'bold', overflow: 'ellipsize' } },
        { content: usDate(req.date), rowSpan: 5, styles: { halign: 'center', valign: 'middle' } },
        { content: req.reqPerson, rowSpan: 5, styles: { halign: 'center', valign: 'middle' } },
        { content: req.status, styles: { fontStyle: 'bold' } },
        { content: hours(requestTotal(req)), rowSpan: 5, styles: { halign: 'center', valign: 'middle' } },
        ...monthCells(wb.months.map(() => 0), DARK_GREY),
      ])
      HOUR_BUCKET_ORDER.forEach((bucket, k) =>
        body.push([
          { content: `${code}-0${k + 1}`, styles: { halign: 'center' } },
          `   ${HOUR_BUCKET_LABEL[bucket]}`,
          req.status,
          ...monthCells(req.hours[bucket]),
        ]),
      )
    })

    autoTable(doc, {
      startY: 86,
      margin: { left: x, right: x },
      head,
      body,
      theme: 'grid',
      pageBreak: 'avoid',
      styles: { fontSize: 6.3, cellPadding: 1.4, textColor: 0, lineColor: 0, lineWidth: 0.4, overflow: 'hidden' },
      headStyles: { fillColor: [255, 255, 255], fontStyle: 'normal', halign: 'center', valign: 'middle' },
      bodyStyles: { halign: 'center' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 190, halign: 'left' },
        2: { cellWidth: 48 },
        3: { cellWidth: 48 },
        4: { cellWidth: 40, halign: 'left' },
        5: { cellWidth: 32 },
      },
      didParseCell: (d) => {
        if (d.section === 'head' && d.row.index === 1) d.cell.styles.fillColor = DARK_GREY
        if (d.section === 'head' && d.row.index === 0) d.cell.styles.minCellHeight = 22
      },
    })
  }
}

/** Page 5- Data: Issues, Feature(s) and Support(s) counted per fiscal month. */
function dataPage(doc: Doc, wb: MaintenanceWorkbook, counts: Record<ActivityClass, number[]>) {
  doc.addPage('a4', 'portrait')
  const pageW = doc.internal.pageSize.getWidth()
  const x = 125
  const w = pageW - 2 * x
  doc.setFillColor(...DATA_ORANGE).rect(x, 125, w, 14, 'F')
  const total = (i: number) => CLASSES.reduce((s, c) => s + counts[c][i], 0)
  const sum = (c: ActivityClass) => counts[c].reduce((s, n) => s + n, 0)
  autoTable(doc, {
    startY: 139,
    margin: { left: x, right: x },
    head: [['Date', 'Issues', 'Feature(s)', 'Support(s)', 'Total']],
    body: wb.months.map((m, i) => [monthLabel(m), ...CLASSES.map((c) => String(counts[c][i])), { content: String(total(i)), styles: { fontStyle: 'bold' } }]),
    foot: [['Total', ...CLASSES.map((c) => String(sum(c))), String(wb.months.reduce((s, _, i) => s + total(i), 0))]],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2, textColor: 0, lineColor: 0, lineWidth: 0.8, halign: 'right' },
    headStyles: { fillColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: [217, 217, 217], fontStyle: 'bold', textColor: 0 },
    columnStyles: { 0: { halign: 'center' } },
    didParseCell: (d) => {
      if (d.section === 'foot' && d.column.index === 0) d.cell.styles.halign = 'center'
      if (d.section === 'foot' && d.column.index === 0) d.cell.styles.fontStyle = 'normal'
    },
  })
}

/**
 * The filled workbook printed the way Excel prints it: Monthly Maintenance Report, Support hours,
 * Page 2-Graph, Page 3-Activity, Page 4-Request and Page 5- Data, each page headed with its sheet's
 * name and numbered "n / N".
 */
export function buildMaintenancePdf(wb: MaintenanceWorkbook): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' }) as Doc
  const actual = wb.months.map((_, i) => wb.requests.reduce((s, r) => s + HOUR_BUCKET_ORDER.reduce((t, b) => t + r.hours[b][i], 0), 0))
  const counts = Object.fromEntries(
    CLASSES.map((c) => [c, wb.months.map((m) => wb.activities.filter((a) => a.month === m && a.classification === c).length)]),
  ) as Record<ActivityClass, number[]>

  const sections: [string, () => void][] = [
    [SHEETS.front, () => frontPage(doc, wb)],
    [SHEETS.hours, () => hoursPage(doc, wb, actual)],
    [SHEETS.graph, () => graphPage(doc, wb)],
    [SHEETS.activity, () => activityPage(doc, wb)],
    [SHEETS.request, () => requestPages(doc, wb, actual)],
    [SHEETS.data, () => dataPage(doc, wb, counts)],
  ]
  const sheetOfPage: string[] = []
  for (const [name, draw] of sections) {
    const before = doc.getNumberOfPages()
    draw()
    const first = name === SHEETS.front ? 1 : before + 1
    for (let p = first; p <= doc.getNumberOfPages(); p++) sheetOfPage[p] = name
  }

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(0)
    doc.text(sheetOfPage[p] ?? '', w - 40, 28, { align: 'right' })
    doc.text(`${p} / ${pages}`, w - 40, h - 22, { align: 'right' })
  }
  return doc
}
