import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type { EntriesReportQueryDto } from '../dto/reports-dto';
import { EntriesReportExcelService } from '../services/entries-report-excel-service';
import { EntriesReportPdfService } from '../services/entries-report-pdf-service';
import { ReportsService } from '../services/reports-service';
import { EntriesReportQuerySchema } from '../validators/reports-validator';

const XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Reports on the signed-in user's own entries. Downloads are files, not enveloped.
@Controller('v1/reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdf: EntriesReportPdfService,
    private readonly excel: EntriesReportExcelService,
  ) {}

  // GET /api/v1/reports/entries?from=YYYY-MM&to=YYYY-MM → { months: [{ label, entries }], … }
  @Get('entries')
  async entries(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(EntriesReportQuerySchema))
    query: EntriesReportQueryDto,
  ) {
    return await this.reportsService.getEntriesReport(user, query);
  }

  // GET /api/v1/reports/entries/pdf?from=YYYY-MM&to=YYYY-MM → application/pdf
  @Get('entries/pdf')
  async entriesPdf(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(EntriesReportQuerySchema))
    query: EntriesReportQueryDto,
  ): Promise<StreamableFile> {
    const report = await this.reportsService.getEntriesReport(user, query);
    return new StreamableFile(await this.pdf.render(report), {
      type: 'application/pdf',
      disposition: `attachment; filename="${fileName(query)}.pdf"`,
    });
  }

  // GET /api/v1/reports/entries/xlsx?from=YYYY-MM&to=YYYY-MM → .xlsx workbook
  @Get('entries/xlsx')
  async entriesExcel(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(EntriesReportQuerySchema))
    query: EntriesReportQueryDto,
  ): Promise<StreamableFile> {
    const report = await this.reportsService.getEntriesReport(user, query);
    return new StreamableFile(await this.excel.render(report), {
      type: XLSX_TYPE,
      disposition: `attachment; filename="${fileName(query)}.xlsx"`,
    });
  }
}

/** "entries-report-2026-10", or "entries-report-2026-09-to-2026-10" */
function fileName(query: EntriesReportQueryDto): string {
  return query.from === query.to
    ? `entries-report-${query.from}`
    : `entries-report-${query.from}-to-${query.to}`;
}
