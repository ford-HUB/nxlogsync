import {
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
 * Uploads unsynced log entries to N-PAX, one day at a time. Only one run is
 * active at once; it is recorded in sync_runs as it starts and finishes.
 */
@Injectable()
export class SyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncService.name);
  private activeRun: Promise<void> | null = null;

  constructor(
    private readonly repository: SyncRepository,
    private readonly logEntries: LogEntriesRepository,
    private readonly npax: NpaxWorkflowClient,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.repository.failInterruptedRuns();
  }

  async getSchedule(): Promise<SyncScheduleDto> {
    return toScheduleResponse(await this.repository.getSchedule());
  }

  async saveSchedule(data: SyncScheduleDto): Promise<SyncScheduleDto> {
    const days = [...new Set(data.days)].sort((a, b) => a - b);
    return toScheduleResponse(
      await this.repository.saveSchedule({ ...data, days }),
    );
  }

  async listRuns(limit = DEFAULT_RUN_LIMIT): Promise<SyncRunResponseDto[]> {
    return (await this.repository.listRuns(limit)).map(toRunResponse);
  }

  async getPending(): Promise<PendingUploadResponseDto> {
    const entries = await this.logEntries.findUnsynced(toDateKey(new Date()));
    return {
      days: new Set(entries.map((e) => e.date)).size,
      minutes: sumMinutes(entries),
    };
  }

  get isRunning(): boolean {
    return this.activeRun !== null;
  }

  /** Records a new run and uploads in the background; poll the runs list for the outcome. */
  async startRun(trigger: SyncTrigger): Promise<SyncRunResponseDto> {
    if (this.activeRun)
      throw new ConflictException('A sync is already running');
    // Claim the slot before the first await so two requests can't both start.
    let release: () => void = () => undefined;
    this.activeRun = new Promise((resolve) => (release = resolve));
    try {
      const run = await this.repository.createRun(trigger);
      void this.execute(run).finally(() => {
        this.activeRun = null;
        release();
      });
      return toRunResponse(run);
    } catch (error) {
      this.activeRun = null;
      release();
      throw error;
    }
  }

  private async execute(run: SyncRun): Promise<void> {
    try {
      const schedule = await this.repository.getSchedule();
      const entries = await this.logEntries.findUnsynced(toDateKey(new Date()));
      if (entries.length === 0) {
        await this.finish(run, 'skipped', [], 'Nothing new to upload');
        return;
      }

      const days = groupByDate(entries);
      const uploaded: LogEntry[] = [];
      const alreadyOnSite: string[] = [];
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
            const outcome = await this.npax.saveAllocationDay({
              date,
              entries: dayEntries,
            });
            // Either way the day is on N-PAX now; it no longer counts as pending.
            await this.logEntries.markSynced(
              dayEntries.map((e) => e.id),
              new Date(),
            );
            if (outcome === 'already-recorded') alreadyOnSite.push(date);
            else uploaded.push(...dayEntries);
          } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Sync of ${date} failed: ${lastError}`);
            failed.push(date);
          }
        }
        remaining = failed;
        if (remaining.length === 0) break;
      }

      const notes: string[] = [];
      if (incomplete.length > 0) {
        notes.push(
          `${incomplete.length} ${incomplete.length === 1 ? 'day needs' : 'days need'} a job and work activity on every entry (${incomplete.join(', ')})`,
        );
      }
      if (alreadyOnSite.length > 0) {
        notes.push(
          `${alreadyOnSite.length} ${alreadyOnSite.length === 1 ? 'day was' : 'days were'} already on N-PAX (${alreadyOnSite.join(', ')})`,
        );
      }
      if (remaining.length > 0) {
        const tries = schedule.retryAttempts + 1;
        notes.unshift(
          `${remaining.length} ${remaining.length === 1 ? 'day' : 'days'} not uploaded after ${tries} ${tries === 1 ? 'try' : 'tries'}: ${lastError}`,
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
    this.logger.log(`Sync run ${run.id} (${run.trigger}) → ${status}`);
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
