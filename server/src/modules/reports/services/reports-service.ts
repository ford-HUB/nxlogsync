import { Injectable, Logger } from '@nestjs/common';
import { workMinutes } from '../../../shared/utils/work-minutes-utils';
import { JobsService } from '../../jobs/services/jobs-service';
import { LogEntriesRepository } from '../../log-entries/repositories/log-entries-repository';
import {
  EntriesReportDto,
  EntriesReportQueryDto,
  ReportMonthDto,
} from '../dto/reports-dto';

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly logEntries: LogEntriesRepository,
    private readonly jobs: JobsService,
  ) {}

  /** The user's entries from the first day of `from` to the last day of `to`, grouped by month. */
  async getEntriesReport(
    user: string,
    query: EntriesReportQueryDto,
  ): Promise<EntriesReportDto> {
    const [entries, jobNames] = await Promise.all([
      this.logEntries.findBetween(user, `${query.from}-01`, `${query.to}-31`),
      this.getJobNames(user),
    ]);

    const months = new Map<string, ReportMonthDto>(
      monthKeysBetween(query.from, query.to).map((month) => [
        month,
        { month, label: monthLabel(month), totalMinutes: 0, entries: [] },
      ]),
    );
    for (const entry of entries) {
      const month = months.get(entry.date.slice(0, 7));
      if (!month) continue;
      const minutes = workMinutes(entry.startMinutes, entry.endMinutes);
      month.totalMinutes += minutes;
      month.entries.push({
        id: entry.id,
        date: entry.date,
        startMinutes: entry.startMinutes,
        endMinutes: entry.endMinutes,
        jobCode: entry.jobCode,
        jobName:
          (entry.jobCode && jobNames.get(entry.jobCode)) ||
          entry.jobCode ||
          'No job',
        workActivityCode: entry.workActivityCode,
        description: entry.description,
        minutes,
      });
    }

    const monthList = [...months.values()];
    return {
      employee: user,
      from: query.from,
      to: query.to,
      generatedAt: new Date().toISOString(),
      totalMinutes: monthList.reduce((sum, m) => sum + m.totalMinutes, 0),
      entryCount: entries.length,
      dayCount: new Set(entries.map((e) => e.date)).size,
      months: monthList,
    };
  }

  /**
   * Job code → client job name from the user's lookup (cached for an hour by
   * JobsService). If N-PAX can't be read, the report falls back to job codes.
   */
  private async getJobNames(user: string): Promise<Map<string, string>> {
    try {
      const lookup = await this.jobs.list(user, false);
      return new Map(
        lookup.jobs
          .filter((job) => job.clientJobName.trim() !== '')
          .map((job) => [job.code, job.clientJobName.trim()]),
      );
    } catch (error) {
      this.logger.warn(
        `Job lookup unavailable for the report, showing job codes: ${String(error)}`,
      );
      return new Map();
    }
  }
}

/** "2026-09", "2026-10" → ["2026-09", "2026-10"] */
function monthKeysBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  let [year, month] = from.split('-').map(Number);
  for (let key = from; key <= to;) {
    keys.push(key);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    key = `${year}-${String(month).padStart(2, '0')}`;
  }
  return keys;
}

/** "2026-10" → "October 2026" */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return MONTH_LABEL_FORMAT.format(new Date(year, month - 1, 1));
}

/** "October 2026", or "September 2026 – October 2026" */
export function periodLabel(report: { from: string; to: string }): string {
  return report.from === report.to
    ? monthLabel(report.from)
    : `${monthLabel(report.from)} – ${monthLabel(report.to)}`;
}
