import { buildMaintenancePdf } from '@/lib/maintenance-report-pdf'
import { saveFile } from '@/services/report-file-service'
import type { FilledWorkbook, GeneratedReport, ImportedSheet } from '@/types/excel-report'

const XLSM_TYPE = 'application/vnd.ms-excel.sheet.macroEnabled.12'
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * The yearly workbook with the month written in, under the name it was imported with (e.g. "FEM
 * Monthly Maintenance Report 2026 - 2027.xlsm"), so next month's report is filled from it again.
 */
export function exportReportExcel(filled: FilledWorkbook): void {
  const { fileName } = filled.workbook
  const type = fileName.toLowerCase().endsWith('.xlsm') ? XLSM_TYPE : XLSX_TYPE
  saveFile(new Blob([filled.bytes as Uint8Array<ArrayBuffer>], { type }), fileName)
}

/** The filled workbook's pages as a PDF: "FEM Monthly Maintenance Report - September 2026.pdf". */
export function exportReportPdf(filled: FilledWorkbook, report: GeneratedReport, sheet: ImportedSheet): void {
  saveFile(buildMaintenancePdf(filled.workbook).output('blob'), `${report.kind} Monthly Maintenance Report - ${sheet.month}.pdf`)
}
