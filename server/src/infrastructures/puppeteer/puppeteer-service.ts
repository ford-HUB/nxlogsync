import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Owns a single shared Chrome instance for automation. The browser is launched
 * lazily on first use and relaunched if it crashes or disconnects. Feature
 * services should use `withPage` so every page is closed when the task ends.
 */
@Injectable()
export class PuppeteerService implements OnModuleDestroy {
  private readonly logger = new Logger(PuppeteerService.name);
  private browserPromise: Promise<Browser> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = this.launch().catch((error: unknown) => {
        this.browserPromise = null;
        throw error;
      });
    }
    return this.browserPromise;
  }

  async newPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    page.setDefaultTimeout(
      Number(this.configService.get('PUPPETEER_TIMEOUT_MS') ?? 30_000),
    );
    return page;
  }

  async withPage<T>(task: (page: Page) => Promise<T>): Promise<T> {
    const page = await this.newPage();
    try {
      return await task(page);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.browserPromise) return;
    const browser = await this.browserPromise.catch(() => null);
    this.browserPromise = null;
    await browser?.close();
  }

  private async launch(): Promise<Browser> {
    const headless =
      this.configService.get<string>('PUPPETEER_HEADLESS') !== 'false';
    const executablePath = this.configService.get<string>(
      'PUPPETEER_EXECUTABLE_PATH',
    );

    const browser = await puppeteer.launch({
      headless,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });

    browser.on('disconnected', () => {
      this.logger.warn('Browser disconnected; it will relaunch on next use');
      this.browserPromise = null;
    });

    this.logger.log(`Browser launched (headless: ${headless})`);
    return browser;
  }
}
