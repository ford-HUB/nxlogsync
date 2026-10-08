import { Injectable } from '@nestjs/common';
import { Borders, Workbook, Worksheet } from 'exceljs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EntriesReportDto } from '../dto/reports-dto';
import { periodLabel } from './reports-service';

/** Copied to dist/assets by nest-cli.json; the same path from src/ and dist/. */
const LOGO_PATH = join(__dirname, '../../../assets/logo-nxlogsync.png');

const HEADER_ROW = 6;
const COLUMNS = [
  { header: 'Month', width: 16 },
  { header: 'Date', width: 12 },
  { header: 'Job Code', width: 18 },
  { header: 'Job Name', width: 30 },
  { header: 'Work Activity', width: 14 },
  { header: 'Task Description', width: 60 },
  { header: 'Hours', width: 10 },
];
const HOURS_COLUMN = COLUMNS.length;
const HOURS_FORMAT = '0.00';

const FILL_HEADER = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF18181B' },
} as const;
const FILL_TOTAL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
} as const;
const THIN_RULE: Partial<Borders> = {
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

const GENERATED_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
});

/** Renders an entries report as an .xlsx: an Entries sheet (one row per entry) and a Summary sheet. */
@Injectable()
export class EntriesReportExcelService {
  async render(report: EntriesReportDto): Promise<Buffer> {
    const workbook = new Workbook();
    workbook.creator = 'NXLogSync';
    workbook.created = new Date(report.generatedAt);
    const logoId = workbook.addImage({
      buffer: readFileSync(LOGO_PATH) as unknown as ArrayBuffer,
      extension: 'png',
    });

    this.entriesSheet(workbook, report, logoId);
    this.summarySheet(workbook, report);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private entriesSheet(
    workbook: Workbook,
    report: EntriesReportDto,
    logoId: number,
  ): void {
    const sheet = workbook.addWorksheet('Entries', {
      views: [{ state: 'frozen', ySplit: HEADER_ROW }],
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
      },
    });
    COLUMNS.forEach((c, i) => (sheet.getColumn(i + 1).width = c.width));
    this.letterhead(sheet, report, logoId);

    const header = sheet.getRow(HEADER_ROW);
    header.values = COLUMNS.map((c) => c.header);
    header.height = 20;
    header.eachCell((cell, col) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = FILL_HEADER;
      cell.alignment = {
        vertical: 'middle',
        horizontal: col === HOURS_COLUMN ? 'right' : 'left',
      };
    });

    const totalCells: string[] = [];
    for (const month of report.months) {
      const first = sheet.rowCount + 1;
      for (const entry of month.entries) {
        const row = sheet.addRow([
          month.label,
          entry.date,
          entry.jobCode ?? '',
          entry.jobName,
          entry.workActivityCode ?? '',
          entry.description,
          Math.round((entry.minutes / 60) * 100) / 100,
        ]);
        row.alignment = { vertical: 'top', wrapText: true };
        row.getCell(HOURS_COLUMN).numFmt = HOURS_FORMAT;
        row.eachCell((cell) => (cell.border = THIN_RULE));
      }
      const last = sheet.rowCount;
      const total = sheet.addRow([`Total for ${month.label}`]);
      const hours = total.getCell(HOURS_COLUMN);
      hours.value =
        month.entries.length > 0
          ? {
              formula: `SUM(G${first}:G${last})`,
              result: month.totalMinutes / 60,
            }
          : 0;
      hours.numFmt = HOURS_FORMAT;
      this.styleTotal(total);
      totalCells.push(hours.address);
      sheet.addRow([]);
    }

    if (report.months.length > 1) {
      const grand = sheet.addRow([`Grand total · ${periodLabel(report)}`]);
      const hours = grand.getCell(HOURS_COLUMN);
      hours.value = {
        formula: totalCells.join('+'),
        result: report.totalMinutes / 60,
      };
      hours.numFmt = HOURS_FORMAT;
      this.styleTotal(grand);
    }
  }

  private letterhead(
    sheet: Worksheet,
    report: EntriesReportDto,
    logoId: number,
  ): void {
    sheet.addImage(logoId, {
      tl: { col: 0.15, row: 0.2 },
      ext: { width: 56, height: 56 },
    });
    sheet.getCell('B1').value = 'Entries Report';
    sheet.getCell('B1').font = { bold: true, size: 16 };
    sheet.getCell('B2').value = 'NXLogSync · Work log summary';
    sheet.getCell('B2').font = { color: { argb: 'FF6B7280' } };

    const meta: [string, string][] = [
      ['Employee', report.employee],
      ['Period', periodLabel(report)],
      ['Generated', GENERATED_FORMAT.format(new Date(report.generatedAt))],
    ];
    meta.forEach(([label, value], i) => {
      const row = sheet.getRow(i + 1);
      row.getCell(5).value = label;
      row.getCell(5).font = { color: { argb: 'FF6B7280' } };
      row.getCell(6).value = value;
      row.getCell(6).font = { bold: true };
    });
    sheet.getRow(4).getCell(5).value = 'Total hours';
    sheet.getRow(4).getCell(5).font = { color: { argb: 'FF6B7280' } };
    sheet.getRow(4).getCell(6).value =
      `${(report.totalMinutes / 60).toFixed(2)} · ${report.entryCount} entries · ${report.dayCount} days`;
    sheet.getRow(4).getCell(6).font = { bold: true };
  }

  private summarySheet(workbook: Workbook, report: EntriesReportDto): void {
    const sheet = workbook.addWorksheet('Summary');
    sheet.columns = [
      { header: 'Month', width: 20 },
      { header: 'Entries', width: 10 },
      { header: 'Hours', width: 10 },
    ];
    sheet.getRow(1).eachCell((cell, col) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = FILL_HEADER;
      cell.alignment = { horizontal: col === 1 ? 'left' : 'right' };
    });
    for (const month of report.months) {
      const row = sheet.addRow([
        month.label,
        month.entries.length,
        Math.round((month.totalMinutes / 60) * 100) / 100,
      ]);
      row.getCell(3).numFmt = HOURS_FORMAT;
      row.eachCell((cell) => (cell.border = THIN_RULE));
    }
    const last = sheet.rowCount;
    const total = sheet.addRow([
      'Total',
      { formula: `SUM(B2:B${last})`, result: report.entryCount },
      { formula: `SUM(C2:C${last})`, result: report.totalMinutes / 60 },
    ]);
    total.getCell(3).numFmt = HOURS_FORMAT;
    total.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = FILL_TOTAL;
    });
  }

  private styleTotal(row: ReturnType<Worksheet['addRow']>): void {
    for (let col = 1; col <= COLUMNS.length; col++) {
      const cell = row.getCell(col);
      cell.font = { bold: true };
      cell.fill = FILL_TOTAL;
      cell.border = { top: { style: 'thin', color: { argb: 'FF111827' } } };
    }
  }
}
