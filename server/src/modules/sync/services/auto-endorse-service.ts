import { Injectable, Logger } from '@nestjs/common';
import {
  LogEntry,
  SyncSchedule,
} from '../../../infrastructures/prisma/common/client';
import { MailService } from '../../../infrastructures/mail/mail-service';
import { toDateKey } from '../../../shared/utils/date-key-utils';
import { workMinutes } from '../../../shared/utils/work-minutes-utils';
import { LogEntriesRepository } from '../../log-entries/repositories/log-entries-repository';
import { RemindersService } from '../../reminders/services/reminders-service';
import { AutoEndorseDto, EndorseOutcome } from '../dto/sync-dto';
import { SyncRepository } from '../repositories/sync-repository';
import { SyncService } from './sync-service';

/** A day must hold this much work (lunch left out) to be auto-endorsed. */
export const AUTO_ENDORSE_MIN_MINUTES = 9 * 60;

const OUTCOME_REASON: Record<Exclude<EndorseOutcome, 'endorsed'>, string> = {
  'short-day': 'N-PAX counts it under 9 hours',
  'not-saved': 'N-PAX has no saved allocation for it',
  'no-time-record': 'N-PAX has no time record for it',
};

export interface AutoEndorseDay {
  date: string;
  minutes: number;
}

export interface AutoEndorseSkippedDay extends AutoEndorseDay {
  reason: string;
}

export interface AutoEndorseReport {
  endorsed: AutoEndorseDay[];
  skipped: AutoEndorseSkippedDay[];
}

export interface AutoEndorseUser {
  user: string;
  dayOfMonth: number;
  /** Run times at or before this are already covered. */
  since: Date;
}

/**
 * Auto-endorse: once a month, on the user's picked day, endorses every synced
 * day that meets the 9-hour requirement and emails what was endorsed and what
 * was left. It holds the user's endorse slot on SyncService for the whole run,
 * so it never drives N-PAX at the same time as that user's sync.
 */
@Injectable()
export class AutoEndorseService {
  private readonly logger = new Logger(AutoEndorseService.name);

  constructor(
    private readonly repository: SyncRepository,
    private readonly logEntries: LogEntriesRepository,
    private readonly sync: SyncService,
    private readonly mail: MailService,
    private readonly reminders: RemindersService,
  ) {}

  async get(user: string): Promise<AutoEndorseDto> {
    return toAutoEndorseResponse(await this.repository.getSchedule(user));
  }

  async save(user: string, data: AutoEndorseDto): Promise<AutoEndorseDto> {
    return toAutoEndorseResponse(
      await this.repository.saveAutoEndorse(user, data),
    );
  }

  async listEnabled(): Promise<AutoEndorseUser[]> {
    const rows = await this.repository.listAutoEndorse();
    return rows.map((row) => ({
      user: row.userId,
      dayOfMonth: row.autoEndorseDay ?? 1,
      since: row.autoEndorsedAt ?? row.updatedAt,
    }));
  }

  /**
   * Endorses the user's days through the run time's date, one at a time, then
   * marks the run done and emails the report. Throws (Conflict) without
   * touching anything if the user's sync is running.
   */
  async runScheduled(user: string, due: Date): Promise<AutoEndorseReport> {
    const report = await this.sync.whileEndorsing(user, () =>
      this.endorseThrough(user, toDateKey(due)),
    );
    await this.repository.markAutoEndorsed(user, new Date());
    this.logger.log(
      `Auto-endorse for ${user}: ${report.endorsed.length} endorsed, ${report.skipped.length} skipped`,
    );
    if (report.endorsed.length > 0 || report.skipped.length > 0) {
      await this.mailReport(user, due, report);
    }
    return report;
  }

  private async endorseThrough(
    user: string,
    throughDate: string,
  ): Promise<AutoEndorseReport> {
    const days = groupByDate(
      await this.logEntries.findUnendorsed(user, throughDate),
    );
    const report: AutoEndorseReport = { endorsed: [], skipped: [] };
    for (const [date, entries] of days) {
      const minutes = entries.reduce(
        (sum, e) => sum + workMinutes(e.startMinutes, e.endMinutes),
        0,
      );
      if (entries.some((e) => e.syncedAt === null)) {
        report.skipped.push({
          date,
          minutes,
          reason: 'Not synced to N-PAX yet',
        });
        continue;
      }
      if (minutes < AUTO_ENDORSE_MIN_MINUTES) {
        report.skipped.push({ date, minutes, reason: 'Under 9 hours' });
        continue;
      }
      try {
        const { outcome } = await this.sync.endorseDayHeld(user, date);
        if (outcome === 'endorsed') report.endorsed.push({ date, minutes });
        else
          report.skipped.push({
            date,
            minutes,
            reason: OUTCOME_REASON[outcome],
          });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Auto-endorse of ${date} for ${user} failed: ${reason}`,
        );
        report.skipped.push({ date, minutes, reason });
      }
    }
    return report;
  }

  /** A mail failure never fails the run. */
  private async mailReport(
    user: string,
    ranAt: Date,
    report: AutoEndorseReport,
  ): Promise<void> {
    try {
      const email = await this.reminders.emailFor(user);
      if (!email) {
        this.logger.warn(
          `No email for ${user}'s auto-endorse report: none read from N-PAX yet`,
        );
        return;
      }
      await this.mail.sendAutoEndorseReport({ to: email, ranAt, ...report });
      this.logger.log(`Sent the auto-endorse report to ${user}`);
    } catch (error) {
      this.logger.warn(
        `Auto-endorse report for ${user} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function toAutoEndorseResponse(row: SyncSchedule): AutoEndorseDto {
  return { enabled: row.autoEndorseEnabled, dayOfMonth: row.autoEndorseDay };
}

function groupByDate(entries: LogEntry[]): Map<string, LogEntry[]> {
  const days = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  }
  return days;
}
