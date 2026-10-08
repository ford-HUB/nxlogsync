import { Module } from '@nestjs/common';
import { JobsModule } from '../../jobs/modules/jobs-module';
import { LogEntriesModule } from '../../log-entries/modules/log-entries-module';
import { ReportsController } from '../controllers/reports-controller';
import { EntriesReportExcelService } from '../services/entries-report-excel-service';
import { EntriesReportPdfService } from '../services/entries-report-pdf-service';
import { ReportsService } from '../services/reports-service';

@Module({
  imports: [LogEntriesModule, JobsModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    EntriesReportPdfService,
    EntriesReportExcelService,
  ],
})
export class ReportsModule {}
