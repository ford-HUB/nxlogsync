import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { LogEntriesRepository } from '../modules/log-entries/repositories/log-entries-repository';
import { connectSavedLogin, NpaxCliModule, userArg } from './npax-cli-module';

/**
 * Fills one day's entries into the N-PAX Allocation Entry page and saves a
 * screenshot under server/captures/. A dry run unless --save is given; even
 * then it presses SAVE only, never Submit.
 *
 *   pnpm npax:fill 2026-10-05          (fill + screenshot, nothing saved)
 *   pnpm npax:fill 2026-10-05 --save   (fill + screenshot + SAVE)
 *   add --user=<User ID> when several logins are saved; that user's entries are filled
 *
 * It does not mark entries as synced; the scheduled sync still owns that.
 */
async function main(): Promise<void> {
  const logger = new Logger('FillNpaxDay');
  const date = process.argv[2];
  const save = process.argv.includes('--save');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      'Usage: pnpm npax:fill YYYY-MM-DD [--save] [--user=<User ID>]',
    );
  }

  const app = await NestFactory.createApplicationContext(NpaxCliModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const { npax, user } = await connectSavedLogin(app, userArg());
    const entries = await app.get(LogEntriesRepository).findByDate(user, date);
    if (entries.length === 0) throw new Error(`No entries logged on ${date}.`);

    const dir = join(process.cwd(), 'captures');
    await mkdir(dir, { recursive: true });
    const screenshotPath = join(
      dir,
      `fill-${date}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
    );
    const outcome = await npax.saveAllocationDay(
      user,
      { date, entries },
      { dryRun: !save, screenshotPath },
    );
    const result = {
      'dry-run': `Filled ${entries.length} row(s); NOT saved (add --save to save).`,
      saved: `Saved ${entries.length} row(s) on N-PAX (not submitted).`,
      'already-recorded': `N-PAX already has allocations on ${date}; nothing changed.`,
    }[outcome];
    logger.log(result);
    if (outcome !== 'already-recorded')
      logger.log(`Screenshot: ${screenshotPath}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : String(error),
    'FillNpaxDay',
  );
  process.exitCode = 1;
});
