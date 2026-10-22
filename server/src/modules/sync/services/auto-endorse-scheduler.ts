import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { NpaxWorkflowClient } from '../../../infrastructures/npax-workflow/npax-workflow-client';
import { AutoEndorseService } from './auto-endorse-service';
import { SyncService } from './sync-service';

const TICK_MS = 60_000;
/** Always 11:59 PM, server local time, on the picked day. */
export const AUTO_ENDORSE_AT_MINUTES = 23 * 60 + 59;
// How often an unreachable user's login is re-checked while their run waits.
const RECHECK_MS = 5 * 60_000;

/**
 * Fires each user's auto-endorse at 11:59 PM on their picked day of the month.
 * Users are taken one at a time and a tick never overlaps the one before, so
 * auto-endorse adds at most one Puppeteer task at a time to the N-PAX queue.
 * A run whose user is syncing, or whose N-PAX session isn't connected, waits
 * for a later tick; one missed while the server was down runs after start-up.
 */
@Injectable()
export class AutoEndorseScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(AutoEndorseScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;
  private readonly lastRecheck = new Map<string, number>();

  constructor(
    private readonly autoEndorse: AutoEndorseService,
    private readonly syncService: SyncService,
    private readonly npax: NpaxWorkflowClient,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (this.ticking) return;
    this.ticking = true;
    try {
      const now = new Date();
      for (const {
        user,
        dayOfMonth,
        since,
      } of await this.autoEndorse.listEnabled()) {
        const due = latestAutoEndorseAt(dayOfMonth, now);
        if (due <= since) continue;
        // Its sync goes first; the endorse picks up what that sync uploaded.
        if (this.syncService.isRunning(user)) continue;
        if (!(await this.ensureConnected(user))) continue;
        try {
          await this.autoEndorse.runScheduled(user, due);
        } catch (error) {
          this.logger.warn(
            `Auto-endorse for ${user} didn't run: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Couldn't read auto-endorse settings: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.ticking = false;
    }
  }

  /** Re-checks a dropped session at most every few minutes; no login waits for the user's next Connect. */
  private async ensureConnected(user: string): Promise<boolean> {
    if (this.syncService.isConnected(user)) return true;
    if (!this.npax.hasLogin(user)) return false;
    const last = this.lastRecheck.get(user) ?? 0;
    if (Date.now() - last < RECHECK_MS) return false;
    this.lastRecheck.set(user, Date.now());
    const status = await this.npax.keepAlive(user).catch(() => null);
    return status?.state === 'connected';
  }
}

/** The latest 11:59 PM run time at or before `now`; a short month runs on its last day. */
export function latestAutoEndorseAt(dayOfMonth: number, now: Date): Date {
  const runIn = (year: number, month: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const run = new Date(year, month, Math.min(dayOfMonth, lastDay));
    run.setMinutes(AUTO_ENDORSE_AT_MINUTES);
    return run;
  };
  const thisMonth = runIn(now.getFullYear(), now.getMonth());
  return thisMonth <= now
    ? thisMonth
    : runIn(now.getFullYear(), now.getMonth() - 1);
}
