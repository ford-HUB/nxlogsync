import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import {
  LogEntry,
  SyncRun,
  SyncSchedule,
} from '../../../infrastructures/prisma/common/client';
import { NpaxWorkflowClient } from '../../../infrastructures/npax-workflow/npax-workflow-client';
import { toDateKey } from '../../../shared/utils/date-key-utils';
import { LogEntriesRepository } from '../../log-entries/repositories/log-entries-repository';
import {
  EndorseDayResponseDto,
  PendingUploadResponseDto,
  SyncRunResponseDto,
  SyncRunStatus,
  SyncScheduleDto,
  SyncTrigger,
} from '../dto/sync-dto';
import { SyncRepository } from '../repositories/sync-repository';

const DEFAULT_RUN_LIMIT = 20;
// Waits between upload retries double from here: 5s, 10s, 20s, …
const RETRY_BACKOFF_MS = 5_000;

/**
 * Uploads a user's unsynced log entries to N-PAX on that user's session, one
 * day at a time. Each user has at most one active run; it is recorded in
 * sync_runs as it starts and finishes. `user` is always the user's key.
 *
 * A run cut short by the N-PAX session ending (expired, rejected or
 * unreachable) is resumed by `resumeDeferred` once the session is logged in
 * again, as is a scheduled run that came due while it was down. The waiting
 * list lives in memory, so on start-up every user whose last run failed (a
 * restart mid-sync included) is put back on it.
 */
@Injectable()
export class SyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncService.name);
  private readonly activeRuns = new Set<string>();
  /** Users with a sync waiting for their N-PAX session to be logged in again. */
  private readonly deferredRuns = new Set<string>();

  constructor(
    private readonly repository: SyncRepository,
    private readonly logEntries: LogEntriesRepository,
    private readonly npax: NpaxWorkflowClient,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.failInterruptedRuns();
    for (const user of await this.repository.usersWithFailedLastRun()) {
      this.deferUntilConnected(user);
    }
  }

  /** Runs a sync for `user` as soon as their N-PAX session is connected. */
  deferUntilConnected(user: string): void {
    if (this.deferredRuns.has(user)) return;
    this.deferredRuns.add(user);
    this.logger.log(
      `Sync for ${user} will resume once N-PAX is logged in again`,
    );
  }

  /** Starts every deferred sync whose user's session is connected again. */
  async resumeDeferred(): Promise<void> {
    for (const user of [...this.deferredRuns]) {
      if (!this.isConnected(user) || this.activeRuns.has(user)) continue;
      this.deferredRuns.delete(user);
      this.logger.log(`N-PAX is logged in again; resuming sync for ${user}`);
      try {
        await this.startRun(user, 'scheduled');
      } catch (error) {
        this.logger.warn(
          `Resumed sync for ${user} failed to start: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  isConnected(user: string): boolean {
    return this.npax.getStatus(user).state === 'connected';
  }

  async getSchedule(user: string): Promise<SyncScheduleDto> {
    return toScheduleResponse(await this.repository.getSchedule(user));
  }

  /** Every user's saved schedule, keyed by user. */
  async listSchedules(): Promise<Map<string, SyncScheduleDto>> {
    const rows = await this.repository.listSchedules();
    return new Map(rows.map((row) => [row.userId, toScheduleResponse(row)]));
  }

  async saveSchedule(
    user: string,
    data: SyncScheduleDto,
  ): Promise<SyncScheduleDto> {
    const days = [...new Set(data.days)].sort((a, b) => a - b);
    return toScheduleResponse(
      await this.repository.saveSchedule(user, { ...data, days }),
    );
  }

  async listRuns(
    user: string,
    limit = DEFAULT_RUN_LIMIT,
  ): Promise<SyncRunResponseDto[]> {
    return (await this.repository.listRuns(user, limit)).map(toRunResponse);
  }

  async getPending(user: string): Promise<PendingUploadResponseDto> {
    const entries = await this.logEntries.findUnsynced(
      user,
      toDateKey(new Date()),
    );
    return {
      days: new Set(entries.map((e) => e.date)).size,
      minutes: sumMinutes(entries),
    };
  }

  /**
   * Endorses one synced day to its checker on N-PAX. Only a day whose entries
   * are all synced can be endorsed (N-PAX must hold what was logged), and not
   * while a sync for the user is running. Endorsing can't be undone here: the
   * day can no longer be cleared or saved over on N-PAX.
   */
  async endorseDay(user: string, date: string): Promise<EndorseDayResponseDto> {
    if (this.activeRuns.has(user)) {
      throw new ConflictException(
        'A sync is running; endorse once it finishes',
      );
    }
    const entries = await this.logEntries.findByDate(user, date);
    if (entries.length === 0) {
      throw new BadRequestException(`Nothing is logged on ${date}`);
    }
    if (entries.some((e) => e.syncedAt === null)) {
      throw new BadRequestException(
        `${date} has entries not yet synced to N-PAX; sync it before endorsing`,
      );
    }
    const outcome = await this.npax.endorseAllocationDay(
      user,
      { date, entries },
      { dryRun: false },
    );
    // Only a dry run reports 'ready'; this one never is.
    if (outcome === 'ready') {
      throw new Error(`N-PAX endorse of ${date} ran as a dry run`);
    }
    this.logger.log(`Endorse of ${date} for ${user}: ${outcome}`);
    return { date, outcome };
  }

  isRunning(user: string): boolean {
    return this.activeRuns.has(user);
  }

  /** Records a new run and uploads in the background; poll the runs list for the outcome. */
  async startRun(
    user: string,
    trigger: SyncTrigger,
  ): Promise<SyncRunResponseDto> {
    if (this.activeRuns.has(user))
      throw new ConflictException('A sync is already running');
    // Claim the slot before the first await so two requests can't both start.
    this.activeRuns.add(user);
    try {
      const run = await this.repository.createRun(user, trigger);
      void this.execute(user, run).finally(() => this.activeRuns.delete(user));
      return toRunResponse(run);
    } catch (error) {
      this.activeRuns.delete(user);
      throw error;
    }
  }

  private async execute(user: string, run: SyncRun): Promise<void> {
    try {
      const schedule = await this.repository.getSchedule(user);
      const entries = await this.logEntries.findDaysToSync(
        user,
        toDateKey(new Date()),
      );
      if (entries.length === 0) {
        await this.finish(run, 'skipped', [], 'Nothing new to upload');
        return;
      }

      const days = groupByDate(entries);
      const uploaded: LogEntry[] = [];
      const replacedOnSite: string[] = [];
      const noTimeRecord: string[] = [];
      // N-PAX needs a job and work activity on every row; those days wait.
      const incomplete = [...days.keys()].filter((date) =>
        (days.get(date) ?? []).some((e) => !e.jobCode || !e.workActivityCode),
      );
      let remaining = [...days.keys()].filter((d) => !incomplete.includes(d));
      let lastError = '';

      for (let attempt = 0; attempt <= schedule.retryAttempts; attempt++) {
        if (attempt > 0) {
          await delay(RETRY_BACKOFF_MS * 2 ** (attempt - 1));
        }
        const failed: string[] = [];
        for (const date of remaining) {
          const dayEntries = days.get(date) ?? [];
          try {
            const outcome = await this.npax.saveAllocationDay(user, {
              date,
              entries: dayEntries,
            });
            // Left unsynced so a later run uploads it once N-PAX has the time record.
            if (outcome === 'no-time-record') {
              noTimeRecord.push(date);
              continue;
            }
            // Only a save N-PAX confirmed keeping marks the day synced; any
            // other outcome leaves it pending for the next run.
            if (outcome !== 'saved' && outcome !== 'replaced') {
              throw new Error(`N-PAX did not save ${date} (${outcome})`);
            }
            await this.logEntries.markSynced(
              dayEntries.map((e) => e.id),
              new Date(),
            );
            if (outcome === 'replaced') replacedOnSite.push(date);
            uploaded.push(...dayEntries);
          } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            this.logger.warn(
              `Sync of ${date} for ${user} failed: ${lastError}`,
            );
            failed.push(date);
          }
        }
        remaining = failed;
        if (remaining.length === 0) break;
        // Retrying can't help until the session is back; resume after re-login instead.
        if (!this.isConnected(user)) break;
      }
      const deferred = remaining.length > 0 && !this.isConnected(user);
      if (deferred) this.deferUntilConnected(user);

      const notes: string[] = [];
      if (incomplete.length > 0) {
        notes.push(
          `${incomplete.length} ${incomplete.length === 1 ? 'day needs' : 'days need'} a job and work activity on every entry (${incomplete.join(', ')})`,
        );
      }
      if (replacedOnSite.length > 0) {
        notes.push(
          `${replacedOnSite.length} ${replacedOnSite.length === 1 ? 'day was' : 'days were'} already on N-PAX and replaced (${replacedOnSite.join(', ')})`,
        );
      }
      if (noTimeRecord.length > 0) {
        notes.push(
          `${noTimeRecord.length} ${noTimeRecord.length === 1 ? 'day has' : 'days have'} no time record on N-PAX yet and will upload once it does (${noTimeRecord.join(', ')})`,
        );
      }
      if (remaining.length > 0) {
        const tries = schedule.retryAttempts + 1;
        notes.unshift(
          deferred
            ? `${remaining.length} ${remaining.length === 1 ? 'day' : 'days'} not uploaded because the N-PAX session ended (${lastError}); the sync resumes once it is logged in again`
            : `${remaining.length} ${remaining.length === 1 ? 'day' : 'days'} not uploaded after ${tries} ${tries === 1 ? 'try' : 'tries'}: ${lastError}`,
        );
        await this.finish(run, 'failed', uploaded, notes.join('. '));
      } else if (uploaded.length === 0) {
        await this.finish(run, 'skipped', [], notes.join('. '));
      } else {
        await this.finish(run, 'success', uploaded, notes.join('. ') || null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sync run ${run.id} crashed: ${message}`);
      if (!this.isConnected(user)) this.deferUntilConnected(user);
      await this.finish(run, 'failed', [], message).catch(() => undefined);
    }
  }

  private async finish(
    run: SyncRun,
    status: Exclude<SyncRunStatus, 'running'>,
    uploaded: LogEntry[],
    message: string | null,
  ): Promise<void> {
    await this.repository.finishRun(run.id, {
      status,
      entryCount: uploaded.length,
      minutes: sumMinutes(uploaded),
      message,
    });
    this.logger.log(
      `Sync run ${run.id} for ${run.userId} (${run.trigger}) → ${status}`,
    );
  }
}

export function toScheduleResponse(row: SyncSchedule): SyncScheduleDto {
  return {
    enabled: row.enabled,
    mode: row.mode as SyncScheduleDto['mode'],
    dailyAtMinutes: row.dailyAtMinutes,
    intervalHours: row.intervalHours,
    windowStartMinutes: row.windowStartMinutes,
    windowEndMinutes: row.windowEndMinutes,
    days: row.days,
    monthlyDaysBeforeEnd: row.monthlyDaysBeforeEnd,
    monthlyWeekdaysOnly: row.monthlyWeekdaysOnly,
    targetUrl: row.targetUrl,
    retryAttempts: row.retryAttempts,
    skipEmptyDays: row.skipEmptyDays,
  };
}

function toRunResponse(run: SyncRun): SyncRunResponseDto {
  return {
    id: run.id,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    trigger: run.trigger as SyncTrigger,
    status: run.status as SyncRunStatus,
    entryCount: run.entryCount,
    minutes: run.minutes,
    message: run.message,
  };
}

function groupByDate(entries: LogEntry[]): Map<string, LogEntry[]> {
  const days = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  }
  return days;
}

function sumMinutes(entries: LogEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.endMinutes - e.startMinutes), 0);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
