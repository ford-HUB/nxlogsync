import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import PDFDocument from 'pdfkit';
import { formatHours } from '../../../shared/utils/work-minutes-utils';
import {
  EntriesReportDto,
  ReportEntryDto,
  ReportMonthDto,
} from '../dto/reports-dto';
import { periodLabel } from './reports-service';

/** Copied to dist/assets by nest-cli.json; the same path from src/ and dist/. */
const LOGO_PATH = join(__dirname, '../../../assets/logo-nxlogsync.png');

const MARGIN = 48;
const FOOTER_HEIGHT = 28;
const CELL_PAD_X = 6;
const CELL_PAD_Y = 5;

const COLOR = {
  ink: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  rule: '#E5E7EB',
  headerFill: '#F3F4F6',
  zebra: '#FAFAFA',
  band: '#18181B',
  bandText: '#FFFFFF',
};

const FONT = { regular: 'Helvetica', bold: 'Helvetica-Bold' };

interface Column {
  key: 'date' | 'job' | 'description' | 'hours';
  label: string;
  width: number;
  align: 'left' | 'right';
}

const GENERATED_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
});

/** Renders an entries report as an A4 PDF: letterhead, summary, one table per month. */
@Injectable()
export class EntriesReportPdfService {
  render(report: EntriesReportDto): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: MARGIN,
        bottom: MARGIN + FOOTER_HEIGHT,
        left: MARGIN,
        right: MARGIN,
      },
      bufferPages: true,
      info: {
        Title: `Entries Report — ${periodLabel(report)}`,
        Author: report.employee,
        Creator: 'NXLogSync',
      },
    });
    const done = collect(doc);
    new ReportWriter(doc, report).write();
    doc.end();
    return done;
  }
}

class ReportWriter {
  private readonly width: number;
  private readonly columns: Column[];

  constructor(
    private readonly doc: PDFKit.PDFDocument,
    private readonly report: EntriesReportDto,
  ) {
    this.width = doc.page.width - MARGIN * 2;
    const fixed = { date: 68, job: 132, hours: 54 };
    this.columns = [
      { key: 'date', label: 'Date', width: fixed.date, align: 'left' },
      { key: 'job', label: 'Job', width: fixed.job, align: 'left' },
      {
        key: 'description',
        label: 'Task Description',
        width: this.width - fixed.date - fixed.job - fixed.hours,
        align: 'left',
      },
      { key: 'hours', label: 'Hours', width: fixed.hours, align: 'right' },
    ];
  }

  write(): void {
    this.letterhead();
    this.summary();
    for (const month of this.report.months) this.month(month);
    this.grandTotal();
    this.footers();
  }

  private get bottom(): number {
    return this.doc.page.height - this.doc.page.margins.bottom;
  }

  private letterhead(): void {
    const { doc } = this;
    const top = MARGIN;
    const logoSize = 44;
    doc.image(LOGO_PATH, MARGIN, top, { width: logoSize, height: logoSize });

    const textX = MARGIN + logoSize + 12;
    doc
      .font(FONT.bold)
      .fontSize(18)
      .fillColor(COLOR.ink)
      .text('Entries Report', textX, top + 4);
    doc
      .font(FONT.regular)
      .fontSize(9)
      .fillColor(COLOR.muted)
      .text('NXLogSync · Work log summary', textX, top + 27);

    const meta: [string, string][] = [
      ['Employee', this.report.employee],
      ['Period', periodLabel(this.report)],
      ['Generated', GENERATED_FORMAT.format(new Date(this.report.generatedAt))],
    ];
    const metaWidth = 250;
    const labelWidth = 60;
    const metaX = MARGIN + this.width - metaWidth;
    meta.forEach(([label, value], i) => {
      const y = top + 2 + i * 14;
      doc
        .font(FONT.regular)
        .fontSize(8)
        .fillColor(COLOR.muted)
        .text(label.toUpperCase(), metaX, y + 1, { width: labelWidth });
      doc
        .font(FONT.bold)
        .fontSize(9)
        .fillColor(COLOR.ink)
        .text(value, metaX + labelWidth, y, {
          width: metaWidth - labelWidth,
          align: 'right',
          lineBreak: false,
          ellipsis: true,
        });
    });

    const ruleY = top + logoSize + 14;
    doc
      .moveTo(MARGIN, ruleY)
      .lineTo(MARGIN + this.width, ruleY)
      .lineWidth(1.5)
      .strokeColor(COLOR.band)
      .stroke();
    doc.y = ruleY + 16;
  }

  private summary(): void {
    const { doc, report } = this;
    const tiles: [string, string][] = [
      ['Total hours', hoursNumber(report.totalMinutes)],
      ['Entries', String(report.entryCount)],
      ['Days logged', String(report.dayCount)],
      ['Months', String(report.months.length)],
    ];
    const gap = 10;
    const tileWidth = (this.width - gap * (tiles.length - 1)) / tiles.length;
    const tileHeight = 46;
    const y = doc.y;
    tiles.forEach(([label, value], i) => {
      const x = MARGIN + i * (tileWidth + gap);
      doc
        .roundedRect(x, y, tileWidth, tileHeight, 4)
        .lineWidth(0.75)
        .strokeColor(COLOR.rule)
        .stroke();
      doc
        .font(FONT.regular)
        .fontSize(7.5)
        .fillColor(COLOR.muted)
        .text(label.toUpperCase(), x + 10, y + 9, { width: tileWidth - 20 });
      doc
        .font(FONT.bold)
        .fontSize(15)
        .fillColor(COLOR.ink)
        .text(value, x + 10, y + 21, { width: tileWidth - 20 });
    });
    doc.y = y + tileHeight + 22;
  }

  private month(month: ReportMonthDto): void {
    const { doc } = this;
    // Keep the band, the column header and at least one row together.
    this.ensureSpace(24 + 20 + 24);
    this.monthBand(month, false);
    this.tableHeader();

    if (month.entries.length === 0) {
      doc
        .font(FONT.regular)
        .fontSize(9)
        .fillColor(COLOR.muted)
        .text('No entries logged this month.', MARGIN + CELL_PAD_X, doc.y + 8, {
          width: this.width - CELL_PAD_X * 2,
        });
      doc.y += 14;
    }

    month.entries.forEach((entry, i) => {
      const height = this.rowHeight(entry);
      if (doc.y + height > this.bottom) {
        doc.addPage();
        this.monthBand(month, true);
        this.tableHeader();
      }
      this.row(entry, height, i % 2 === 1);
    });

    this.ensureSpace(22);
    const y = doc.y;
    doc
      .moveTo(MARGIN, y)
      .lineTo(MARGIN + this.width, y)
      .lineWidth(0.75)
      .strokeColor(COLOR.ink)
      .stroke();
    doc
      .font(FONT.bold)
      .fontSize(9)
      .fillColor(COLOR.ink)
      .text(`Total for ${month.label}`, MARGIN + CELL_PAD_X, y + 6, {
        width: this.width / 2,
      })
      .text(formatHours(month.totalMinutes), MARGIN + this.width / 2, y + 6, {
        width: this.width / 2 - CELL_PAD_X,
        align: 'right',
      });
    doc.y = y + 30;
  }

  private monthBand(month: ReportMonthDto, continued: boolean): void {
    const { doc } = this;
    const y = doc.y;
    const height = 22;
    doc.rect(MARGIN, y, this.width, height).fill(COLOR.band);
    doc
      .font(FONT.bold)
      .fontSize(10.5)
      .fillColor(COLOR.bandText)
      .text(
        continued ? `${month.label} (continued)` : month.label,
        MARGIN + CELL_PAD_X + 2,
        y + 6.5,
        { width: this.width / 2 },
      );
    const count = month.entries.length;
    doc
      .font(FONT.regular)
      .fontSize(8.5)
      .text(
        `${count} ${count === 1 ? 'entry' : 'entries'} · ${formatHours(month.totalMinutes)}`,
        MARGIN + this.width / 2,
        y + 7.5,
        { width: this.width / 2 - CELL_PAD_X - 2, align: 'right' },
      );
    doc.y = y + height;
  }

  private tableHeader(): void {
    const { doc } = this;
    const y = doc.y;
    const height = 20;
    doc.rect(MARGIN, y, this.width, height).fill(COLOR.headerFill);
    let x = MARGIN;
    doc.font(FONT.bold).fontSize(8).fillColor(COLOR.muted);
    for (const column of this.columns) {
      doc.text(column.label.toUpperCase(), x + CELL_PAD_X, y + 6.5, {
        width: column.width - CELL_PAD_X * 2,
        align: column.align,
        characterSpacing: 0.4,
      });
      x += column.width;
    }
    doc.y = y + height;
  }

  private cells(entry: ReportEntryDto): Record<Column['key'], string> {
    return {
      date: entry.date,
      job: entry.jobName,
      description: entry.description,
      hours: hoursNumber(entry.minutes),
    };
  }

  /** The job cell adds the code under the name when they differ. */
  private jobCode(entry: ReportEntryDto): string | null {
    return entry.jobCode && entry.jobCode !== entry.jobName
      ? entry.jobCode
      : null;
  }

  private rowHeight(entry: ReportEntryDto): number {
    const { doc } = this;
    const cells = this.cells(entry);
    let tallest = 0;
    for (const column of this.columns) {
      doc.font(column.key === 'job' ? FONT.bold : FONT.regular).fontSize(9);
      let height = doc.heightOfString(cells[column.key], {
        width: column.width - CELL_PAD_X * 2,
      });
      const code = column.key === 'job' ? this.jobCode(entry) : null;
      if (code) {
        doc.font(FONT.regular).fontSize(7.5);
        height +=
          2 +
          doc.heightOfString(code, { width: column.width - CELL_PAD_X * 2 });
      }
      tallest = Math.max(tallest, height);
    }
    return tallest + CELL_PAD_Y * 2;
  }

  private row(entry: ReportEntryDto, height: number, shaded: boolean): void {
    const { doc } = this;
    const y = doc.y;
    if (shaded) doc.rect(MARGIN, y, this.width, height).fill(COLOR.zebra);
    doc
      .moveTo(MARGIN, y + height)
      .lineTo(MARGIN + this.width, y + height)
      .lineWidth(0.5)
      .strokeColor(COLOR.rule)
      .stroke();

    const cells = this.cells(entry);
    let x = MARGIN;
    for (const column of this.columns) {
      const width = column.width - CELL_PAD_X * 2;
      doc
        .font(column.key === 'job' ? FONT.bold : FONT.regular)
        .fontSize(9)
        .fillColor(column.key === 'date' ? COLOR.muted : COLOR.ink)
        .text(cells[column.key], x + CELL_PAD_X, y + CELL_PAD_Y, {
          width,
          align: column.align,
        });
      const code = column.key === 'job' ? this.jobCode(entry) : null;
      if (code) {
        doc
          .font(FONT.regular)
          .fontSize(7.5)
          .fillColor(COLOR.faint)
          .text(code, x + CELL_PAD_X, doc.y + 2, { width });
      }
      x += column.width;
    }
    doc.y = y + height;
  }

  private grandTotal(): void {
    const { doc, report } = this;
    if (report.months.length < 2) return;
    this.ensureSpace(30);
    const y = doc.y;
    doc.rect(MARGIN, y, this.width, 26).fill(COLOR.headerFill);
    doc
      .font(FONT.bold)
      .fontSize(10)
      .fillColor(COLOR.ink)
      .text(
        `Grand total · ${periodLabel(report)}`,
        MARGIN + CELL_PAD_X + 2,
        y + 8.5,
        {
          width: this.width / 2,
        },
      )
      .text(
        formatHours(report.totalMinutes),
        MARGIN + this.width / 2,
        y + 8.5,
        {
          width: this.width / 2 - CELL_PAD_X - 2,
          align: 'right',
        },
      );
    doc.y = y + 26;
  }

  /** "Page x of y" and the generator line on every page, drawn once all pages exist. */
  private footers(): void {
    const { doc } = this;
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Writing inside the bottom margin would otherwise start a new page.
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const y = doc.page.height - MARGIN - 6;
      doc
        .moveTo(MARGIN, y - 8)
        .lineTo(MARGIN + this.width, y - 8)
        .lineWidth(0.5)
        .strokeColor(COLOR.rule)
        .stroke();
      doc
        .font(FONT.regular)
        .fontSize(7.5)
        .fillColor(COLOR.faint)
        .text(
          `NXLogSync · Entries Report · ${this.report.employee}`,
          MARGIN,
          y,
          { width: this.width / 2, lineBreak: false },
        )
        .text(
          `Page ${i - range.start + 1} of ${range.count}`,
          MARGIN + this.width / 2,
          y,
          { width: this.width / 2, align: 'right', lineBreak: false },
        );
      doc.page.margins.bottom = bottomMargin;
    }
  }

  private ensureSpace(height: number): void {
    if (this.doc.y + height > this.bottom) this.doc.addPage();
  }
}

/** 90 → "1.50" */
function hoursNumber(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

function collect(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
