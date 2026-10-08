import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ReminderSetting } from '../../../infrastructures/prisma/common/client';
import { RemindersService } from './reminders-service';

const TICK_MS = 60_000;

/** The report goes out this many days before the last day of the month. */
const DAYS_BEFORE_MONTH_END = 2;

/**
 * Sends a user's month-end reminder when their reminder time on the report day
 * (two days before the month's last day) falls between two ticks, and, for
 * users who opted in, a day-of reminder at that time on each of their work
 * days (except the report day, which the month-end report covers). Times are
 * the server machine's local time, like syncs.
 *
 * The first tick after a start catches up on sends missed while the server
 * was down, as long as they still matter: this month's report until the month
 * ends, and today's day-of reminder. Each send is recorded by date, so a
 * restart never sends one twice.
 */
@Injectable()
export class ReminderScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ReminderScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  /** Null until the first tick, which catches up instead of looking back one tick. */
  private lastTick: Date | null = null;

  constructor(private readonly reminders: RemindersService) {}

  onApplicationBootstrap(): void {
    this.lastTick = null;
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    const to = new Date();
    const reportFrom = this.lastTick ?? startOfMonth(to);
    const nudgeFrom = this.lastTick ?? startOfDay(to);
    this.lastTick = to;
    let settings: ReminderSetting[];
    try {
      settings = await this.reminders.listEnabled();
    } catch (error) {
      this.logger.warn(
        `Couldn't read reminder settings: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    for (const setting of settings) {
      try {
        const report = dueBetween(setting, reportFrom, to, isReportDay);
        // A caught-up report already lists today; no day-of reminder on top.
        const reported =
          report !== null &&
          (await this.reminders.remindIfMonthShort(setting, report));
        const nudge =
          setting.nudge &&
          dueBetween(setting, nudgeFrom, to, (day) => isNudgeDay(setting, day));
        if (nudge && !reported) {
          await this.reminders.nudgeIfShort(setting, nudge);
        }
      } catch (error) {
        this.logger.warn(
          `Reminder for ${setting.userId} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

/**
 * The latest reminder time in [from, to] on a day `isDue` accepts, if any. The
 * report day ignores the setting's days, so it may fall on a weekend.
 */
function dueBetween(
  setting: ReminderSetting,
  from: Date,
  to: Date,
  isDue: (day: Date) => boolean,
): Date | null {
  let due: Date | null = null;
  for (
    const day = startOfDay(from);
    day <= to;
    day.setDate(day.getDate() + 1)
  ) {
    if (!isDue(day)) continue;
    const at = new Date(day);
    at.setMinutes(setting.atMinutes);
    if (at >= from && at <= to) due = at;
  }
  return due;
}

function startOfDay(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), at.getDate());
}

function startOfMonth(at: Date): Date {
  return new Date(at.getFullYear(), at.getMonth(), 1);
}

function isNudgeDay(setting: ReminderSetting, day: Date): boolean {
  return setting.days.includes(day.getDay()) && !isReportDay(day);
}

function isReportDay(day: Date): boolean {
  const lastDay = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
  return day.getDate() === lastDay - DAYS_BEFORE_MONTH_END;
}
