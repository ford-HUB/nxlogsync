import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { HOUR_BUCKET_LABEL, HOUR_BUCKET_ORDER, REPORT_TEMPLATES } from '@/constants/excel-report'
import { saveFile } from '@/services/report-file-service'
import type { GeneratedReport, ImportedSheet } from '@/types/excel-report'

/** "FEM Monthly Maintenance Report - September 2026" */
const baseName = (report: GeneratedReport, sheet: ImportedSheet) =>
  `${report.kind} Monthly Maintenance Report - ${sheet.month}`

const variance = (r: GeneratedReport) => r.planHours - r.actualHours

/** Page 4-Request rows: No., description, date, total, then the four hour rows (blank when 0). */
function requestRows(report: GeneratedReport): (string | number)[][] {
  return report.requests.map((r, i) => [
    i + 1,
    r.description,
    r.date,
    r.total,
    ...HOUR_BUCKET_ORDER.map((b) => r.split[b] || ''),
  ])
}

function requestTotals(report: GeneratedReport): (string | number)[] {
  const sum = (b: (typeof HOUR_BUCKET_ORDER)[number]) => report.requests.reduce((s, r) => s + r.split[b], 0)
  return ['', 'Total', '', report.requests.reduce((s, r) => s + r.total, 0), ...HOUR_BUCKET_ORDER.map((b) => sum(b) || '')]
}

const REQUEST_HEADER = ['No.', 'Request / Fixing Description', 'Req. Date', 'Total(H)', ...HOUR_BUCKET_ORDER.map((b) => HOUR_BUCKET_LABEL[b])]

function sheetOf(rows: (string | number | null)[][], widths: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = widths.map((wch) => ({ wch }))
  return ws
}

/**
 * The report as an .xlsx with the maintenance workbook's pages: Monthly Maintenance Report (overview
 * and days), Support hours, hours by Work Activity, Page 4-Request, and the extracted entries.
 */
export function exportReportExcel(report: GeneratedReport, sheet: ImportedSheet): void {
  const template = REPORT_TEMPLATES[report.kind]
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    sheetOf(
      [
        [report.title],
        [],
        ['Monthly Overview'],
        ['These are the list of sent and for deployment updates:'],
        [],
        ...report.overview.map((item, i) => [i + 1, item.text]),
        [],
        ['NO OF DAYS', report.workingDays],
      ],
      [12, 100],
    ),
    'Monthly Maintenance Report',
  )

  XLSX.utils.book_append_sheet(
    wb,
    sheetOf(
      [
        [`${sheet.month.toUpperCase()} MAINTENANCE HOURS`],
        [],
        ['', sheet.month],
        ['Plan', report.planHours],
        ['Actual', report.actualHours],
        ['Variance', variance(report)],
        [],
        ['Job code', 'Job', 'Actual hours'],
        ...report.byJob.map((j) => [j.code, j.name, j.hours]),
      ],
      [16, 22, 14],
    ),
    'Support hours',
  )

  XLSX.utils.book_append_sheet(
    wb,
    sheetOf(
      [['Code', 'Work Activity', 'Hours'], ...report.byWorkActivity.map((a) => [a.code, a.name, a.hours])],
      [12, 36, 10],
    ),
    'Work Activity',
  )

  XLSX.utils.book_append_sheet(
    wb,
    sheetOf([REQUEST_HEADER, ...requestRows(report), requestTotals(report)], [6, 70, 12, 10, 12, 26, 13, 10]),
    'Page 4-Request',
  )

  XLSX.utils.book_append_sheet(
    wb,
    sheetOf(
      [
        ['Date', 'Job Code', 'Job Name', 'Employee ID', 'Employee Name', 'Work Account Code', 'Hours', 'Remarks', 'Source', 'Status', 'Note'],
        ...sheet.rows.map((r) => [
          r.date,
          r.jobCode,
          r.jobName,
          r.employeeId,
          r.employeeName,
          r.workAccount,
          r.hours,
          r.remarks,
          r.approval === 'on-route' ? 'On Route' : 'Approved',
          r.status,
          r.issue ?? '',
        ]),
      ],
      [11, 16, 30, 11, 26, 12, 7, 70, 10, 8, 40],
    ),
    'Entries',
  )

  wb.Props = { Title: report.title, Subject: template.client }
  const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  saveFile(
    new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${baseName(report, sheet)}.xlsx`,
  )
}

/** jsPDF's built-in fonts only cover Latin-1; swap the few characters the report uses beyond it. */
const pdfText = (text: string) => text.replace(/…/g, '...').replace(/[–—]/g, '-').replace(/→/g, '->')

type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } }

/**
 * The report as an A4 PDF: title and hours on the first page with the Monthly Overview, then the
 * hours by Work Activity and Page 4-Request tables.
 */
export function exportReportPdf(report: GeneratedReport, sheet: ImportedSheet): void {
  const template = REPORT_TEMPLATES[report.kind]
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }) as DocWithTable
  const margin = 40
  const width = doc.internal.pageSize.getWidth() - margin * 2
  let y = margin + 8

  doc.setFont('helvetica', 'bold').setFontSize(15).text(pdfText(report.title), margin, y)
  y += 16
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110).text(`${template.client} · ${sheet.month}`, margin, y)
  doc.setTextColor(0)
  y += 22

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Plan (h)', 'Actual (h)', 'Variance (h)', 'No. of days', ...report.byJob.map((j) => `${j.name} (h)`)]],
    body: [[report.planHours, report.actualHours, variance(report), report.workingDays, ...report.byJob.map((j) => j.hours)]],
    theme: 'grid',
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [60, 60, 60] },
  })
  y = doc.lastAutoTable.finalY + 24

  doc.setFont('helvetica', 'bold').setFontSize(11).text('Monthly Overview', margin, y)
  y += 14
  doc.setFont('helvetica', 'normal').setFontSize(9).text('These are the list of sent and for deployment updates:', margin, y)
  y += 6
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: report.overview.map((item, i) => [i + 1, pdfText(item.text)]),
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 24, halign: 'right', fontStyle: 'bold' } },
  })
  y = doc.lastAutoTable.finalY + 24

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Code', 'Work Activity', 'Hours']],
    body: report.byWorkActivity.map((a) => [a.code, a.name, a.hours]),
    theme: 'striped',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: { 2: { halign: 'right' } },
    tableWidth: width * 0.6,
  })

  doc.addPage()
  doc.setFont('helvetica', 'bold').setFontSize(13).text('Activity Description · Page 4-Request', margin, margin + 8)
  autoTable(doc, {
    startY: margin + 22,
    margin: { left: margin, right: margin },
    head: [REQUEST_HEADER.map((h) => (h === HOUR_BUCKET_LABEL.development ? 'Development' : h))],
    body: requestRows(report).map((row) => row.map((c) => (typeof c === 'string' ? pdfText(c) : c))),
    foot: [requestTotals(report).map((c) => ({ content: String(c), styles: { halign: typeof c === 'number' ? 'right' : 'left' } as const }))],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [60, 60, 60], fontSize: 8, overflow: 'visible' },
    footStyles: { fillColor: [235, 235, 235], textColor: 20 },
    columnStyles: {
      0: { cellWidth: 26, halign: 'right' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 58 },
      3: { cellWidth: 40, halign: 'right' },
      4: { cellWidth: 52, halign: 'right' },
      5: { cellWidth: 60, halign: 'right' },
      6: { cellWidth: 54, halign: 'right' },
      7: { cellWidth: 42, halign: 'right' },
    },
  })

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(8).setTextColor(130)
    doc.text(`Page ${p} of ${pages}`, doc.internal.pageSize.getWidth() - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' })
  }

  saveFile(doc.output('blob'), `${baseName(report, sheet)}.pdf`)
}
