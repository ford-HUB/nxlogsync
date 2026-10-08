import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ReminderSetting } from '../../../infrastructures/prisma/common/client';
import { RemindersService } from './reminders-service';

const TICK_MS = 60_000;

/**
 * Sends a user's reminder when their reminder time on one of their days falls
 * between two ticks. Times are the server machine's local time, like syncs.
 */
@Injectable()
export class ReminderScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ReminderScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private lastTick = new Date();

  constructor(private readonly reminders: RemindersService) {}

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
      const due = dueBetween(setting, from, to);
      if (!due) continue;
      try {
        await this.reminders.remindIfShort(setting, due);
      } catch (error) {
        this.logger.warn(
          `Reminder for ${setting.userId} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

/** The reminder time in (from, to] on one of the setting's days, if any. */
function dueBetween(
  setting: ReminderSetting,
  from: Date,
  to: Date,
): Date | null {
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (; day <= to; day.setDate(day.getDate() + 1)) {
    if (!setting.days.includes(day.getDay())) continue;
    const at = new Date(day);
    at.setMinutes(setting.atMinutes);
    if (at > from && at <= to) return at;
  }
  return null;
}
