import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { connectSavedLogin, NpaxCliModule } from './npax-cli-module';

/**
 * Saves the N-PAX allocation pages, their scripts and lookup popups under
 * server/captures/<timestamp>/, using the login saved by Connect.
 *
 *   pnpm capture:npax
 */
async function main(): Promise<void> {
  const logger = new Logger('CaptureNpaxPages');
  const app = await NestFactory.createApplicationContext(NpaxCliModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const npax = await connectSavedLogin(app);
    const pages = await npax.capturePages();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = join(process.cwd(), 'captures', stamp);
    await mkdir(dir, { recursive: true });
    for (const [i, page] of pages.entries()) {
      const isScript = page.name.endsWith('.js');
      const file = `${String(i + 1).padStart(2, '0')}-${page.name.replace(/[^\w.-]/g, '_')}${isScript ? '' : '.html'}`;
      const header = isScript ? `// ${page.url}` : `<!-- ${page.url} -->`;
      await writeFile(join(dir, file), `${header}\n${page.html}`, 'utf8');
      logger.log(`Saved ${file} (${page.url})`);
    }
    logger.log(`${pages.length} page(s) saved to ${dir}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : String(error),
    'CaptureNpaxPages',
  );
  process.exitCode = 1;
});
