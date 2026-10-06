import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { SyncScheduleDto } from '../dto/sync-dto';
import { SyncService } from './sync-service';

const TICK_MS = 60_000;

/**
 * Fires a user's scheduled sync when a run time from their saved schedule falls
 * between two ticks. A run that comes due while the user's N-PAX session isn't
 * connected (expired, re-logging in, or signed out) would only fail, so it is
 * deferred and started on the first tick after the session is logged in again,
 * along with any run the session ending cut short. Times are the server
 * machine's local time, the same clock the desktop uses to show "Next sync".
 */
@Injectable()
export class SyncScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SyncScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private lastTick = new Date();

  constructor(private readonly syncService: SyncService) {}

  onApplicationBootstrap(): void {
    this.lastTick = new Date();
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    const from = this.lastTick;
    const to = new Date();
    this.lastTick = to;
    await this.syncService.resumeDeferred();
    let schedules: Map<string, SyncScheduleDto>;
    try {
      schedules = await this.syncService.listSchedules();
    } catch (error) {
      this.logger.warn(
        `Couldn't read sync schedules: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    for (const [user, schedule] of schedules) {
      if (!hasRunBetween(schedule, from, to)) continue;
      if (!this.syncService.isConnected(user)) {
        this.syncService.deferUntilConnected(user);
        continue;
      }
      if (this.syncService.isRunning(user)) {
        this.logger.warn(
          `Scheduled sync for ${user} skipped: a sync is already running`,
        );
        continue;
      }
      try {
        await this.syncService.startRun(user, 'scheduled');
      } catch (error) {
        this.logger.warn(
          `Scheduled sync for ${user} failed to start: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

/** Whether the schedule has a run time in (from, to]. Mirrors the desktop's "upcoming runs". */
export function hasRunBetween(
  schedule: SyncScheduleDto,
  from: Date,
  to: Date,
): boolean {
  if (!schedule.enabled || schedule.mode === 'manual') return false;
  const inRange = (run: Date) => run > from && run <= to;

  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (; day <= to; day.setDate(day.getDate() + 1)) {
    if (schedule.mode === 'monthly') {
      if (inRange(monthlyRunFor(schedule, day.getFullYear(), day.getMonth()))) {
        return true;
      }
      continue;
    }
    if (!schedule.days.includes(day.getDay())) continue;
    for (const minutes of runTimesForDay(schedule)) {
      const run = new Date(day);
      run.setMinutes(minutes);
      if (inRange(run)) return true;
    }
  }
  return false;
}

function runTimesForDay(schedule: SyncScheduleDto): number[] {
  if (schedule.mode === 'daily') return [schedule.dailyAtMinutes];
  const times: number[] = [];
  const step = schedule.intervalHours * 60;
  for (
    let t = schedule.windowStartMinutes;
    t <= schedule.windowEndMinutes;
    t += step
  ) {
    times.push(t);
  }
  return times;
}

function monthlyRunFor(
  schedule: SyncScheduleDto,
  year: number,
  month: number,
): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const run = new Date(
    year,
    month,
    Math.max(1, lastDay - schedule.monthlyDaysBeforeEnd),
  );
  if (schedule.monthlyWeekdaysOnly) {
    const weekday = run.getDay();
    if (weekday === 6) run.setDate(run.getDate() - 1);
    if (weekday === 0) run.setDate(run.getDate() - 2);
  }
  run.setMinutes(schedule.dailyAtMinutes);
  return run;
}
