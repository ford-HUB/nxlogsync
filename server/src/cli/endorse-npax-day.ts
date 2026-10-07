import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { LogEntriesRepository } from '../modules/log-entries/repositories/log-entries-repository';
import { connectSavedLogin, NpaxCliModule, userArg } from './npax-cli-module';

/**
 * Checks whether one day is ready to endorse on N-PAX and saves a screenshot
 * under server/captures/. Always a dry run: it never presses Endorse, so
 * nothing is endorsed.
 *
 *   pnpm npax:endorse 2026-10-05
 *   add --user=<User ID> when several logins are saved
 */
async function main(): Promise<void> {
  const logger = new Logger('EndorseNpaxDay');
  const date = process.argv[2];
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Usage: pnpm npax:endorse YYYY-MM-DD [--user=<User ID>]');
  }

  const app = await NestFactory.createApplicationContext(NpaxCliModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const { npax, user } = await connectSavedLogin(app, userArg());
    const entries = await app.get(LogEntriesRepository).findByDate(user, date);
    if (entries.length === 0) throw new Error(`No entries logged on ${date}.`);
    // Only what a sync saved can be endorsed; anything newer goes up first.
    if (entries.some((e) => e.syncedAt === null)) {
      throw new Error(
        `${date} has entries not yet synced to N-PAX; sync it before endorsing.`,
      );
    }

    const dir = join(process.cwd(), 'captures');
    await mkdir(dir, { recursive: true });
    const screenshotPath = join(
      dir,
      `endorse-${date}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
    );
    const outcome = await npax.endorseAllocationDay(
      user,
      { date, entries },
      { dryRun: true, screenshotPath },
    );
    const result = {
      ready: `${date} is ready to endorse; Endorse was NOT pressed (dry run).`,
      endorsed: `${date} was endorsed.`,
      'short-day': `${date} has less than 9h logged, so it would not be endorsed.`,
      'not-saved': `N-PAX has no saved allocation on ${date}; sync it first.`,
      'no-time-record': `N-PAX has no time record for ${date} yet.`,
    }[outcome];
    logger.log(result);
    if (outcome === 'ready') logger.log(`Screenshot: ${screenshotPath}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : String(error),
    'EndorseNpaxDay',
  );
  process.exitCode = 1;
});
