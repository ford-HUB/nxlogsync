import {
  Injectable,
  Logger,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, {
  Browser,
  Dialog,
  BrowserContext,
  Page,
  TimeoutError,
} from 'puppeteer';
import { formatClock } from '../../shared/utils/date-key-utils';

const LOGIN_PATH = '/index.aspx';
const JOB_SPLIT_PATH = '/Transactions/ManhourAllocation/pgeJobSplitMod.aspx';
const ALLOCATION_ENTRY_PATH =
  '/Transactions/ManhourAllocation/pgeWorkRecord.aspx';
// SAVE only; the page's Submit/Endorse buttons are never pressed.
const SAVE_BUTTON = '#ctl00_ContentPlaceHolder1_btnZ';
// Positions of a row's <input>s, as the site's _manhour.js counts them.
const RBL_BILLABLE_YES_INPUT = 11;
const HBILLABLE_INPUT = 18;
const NAV_TIMEOUT_MS = 30_000;
// How long to wait for the User ID box's autopostback before assuming there is none.
const POSTBACK_GRACE_MS = 2_000;
const DEFAULT_RELOGIN_ATTEMPTS = 3;
// Waits between re-login attempts double from here: 2s, 4s, 8s, …
const RELOGIN_BACKOFF_MS = 2_000;

export type NpaxSessionState =
  'connected' | 'reconnecting' | 'unreachable' | 'disconnected';

export interface NpaxSessionStatus {
  state: NpaxSessionState;
  userId: string | null;
  /** ISO time of the last successful check or login. */
  checkedAt: string | null;
  /** Why the session is not connected, when there is a reason worth showing. */
  message: string | null;
}

/** One day of log entries to record on the N-PAX allocation page. Minutes are since local midnight. */
export interface NpaxAllocationDay {
  /** "YYYY-MM-DD" */
  date: string;
  entries: {
    startMinutes: number;
    endMinutes: number;
    description: string;
    /** Code to pick in the Work Activity lookup; null when the entry has none yet. */
    workActivityCode: string | null;
    /** Code to pick in the Job lookup; null when the entry has none yet. */
    jobCode: string | null;
  }[];
}

/**
 * 'already-recorded' = N-PAX had allocations for that day, so nothing was added;
 * 'dry-run' = the form was filled but not saved.
 */
export type NpaxAllocationOutcome = 'saved' | 'already-recorded' | 'dry-run';

/** One page's HTML as captured by `capturePages`. */
export interface NpaxCapturedPage {
  name: string;
  url: string;
  html: string;
}

interface NpaxLogin {
  userId: string;
  password: string;
}
const MAX_MONTHS_BACK = 3;
// ASP.NET Calendar postback args are day offsets from 2000-01-01.
const CALENDAR_EPOCH_UTC = Date.UTC(2000, 0, 1);

/**
 * Reads attendance values from the N-PAX workflow site through one headless
 * browser session. Requests are queued so the site only ever sees one
 * navigation at a time. The session belongs to whoever last connected (or the
 * login restored at startup); `keepAlive` refreshes it and logs in again when
 * the site has expired it.
 */
@Injectable()
export class NpaxWorkflowClient implements OnModuleDestroy {
  private readonly logger = new Logger(NpaxWorkflowClient.name);
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  // Held in memory only, so the session can be re-established after the site expires it.
  private login: NpaxLogin | null = null;
  private status: NpaxSessionStatus = {
    state: 'disconnected',
    userId: null,
    checkedAt: null,
    message: null,
  };
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly config: ConfigService) {}

  /** Returns the "Time In 1" value (HH:mm) for a date, or null if blank. */
  getTimeIn(date: Date): Promise<string | null> {
    return this.enqueue(async () => {
      const page = await this.openJobSplitPage();
      await this.selectDate(page, date);

      const expected = [date.getMonth() + 1, date.getDate()]
        .map((n) => String(n).padStart(2, '0'))
        .concat(String(date.getFullYear()))
        .join('/');
      const shown = await this.readInputNearLabel(page, 'Date', 'right');
      if (shown?.trim() !== expected) {
        throw new ServiceUnavailableException(
          `N-PAX showed date ${shown ?? '(none)'} instead of ${expected}`,
        );
      }

      const value = await this.readInputNearLabel(page, 'Time In 1', 'below');
      return value?.trim() || null;
    });
  }

  /**
   * Records one day's entries on the N-PAX Allocation Entry page the way a
   * person would: times typed in, Job and Work Activity picked through their
   * lookup popups, description in Particulars. Then presses SAVE, never
   * SUBMIT, so nothing is endorsed. Days that already have allocations on
   * N-PAX are left untouched.
   *
   * With `dryRun` the form is filled and screenshotted but not saved.
   */
  saveAllocationDay(
    day: NpaxAllocationDay,
    options: { dryRun?: boolean; screenshotPath?: string } = {},
  ): Promise<NpaxAllocationOutcome> {
    return this.enqueue(async () => {
      const incomplete = day.entries.find(
        (e) => !e.jobCode || !e.workActivityCode,
      );
      if (incomplete) {
        throw new ServiceUnavailableException(
          `${day.date}: the ${formatClock(incomplete.startMinutes)} entry has no job or work activity picked`,
        );
      }

      const page = await this.openSignedInPage(ALLOCATION_ENTRY_PATH);
      const [year, month, date] = day.date.split('-').map(Number);
      await this.selectDate(page, new Date(year, month - 1, date));

      const form = await page.evaluate(() => {
        const value = (id: string) =>
          (
            document.getElementById(
              `ctl00_ContentPlaceHolder1_${id}`,
            ) as HTMLInputElement | null
          )?.value ?? '';
        return {
          date: value('txtDate'),
          dayFlag: value('hiddenDFlag'),
          existing: value('txtJStart'),
        };
      });
      const expected = `${String(month).padStart(2, '0')}/${String(date).padStart(2, '0')}/${year}`;
      if (form.date.trim() !== expected) {
        throw new ServiceUnavailableException(
          `N-PAX showed date ${form.date || '(none)'} instead of ${expected}`,
        );
      }
      if (form.existing.trim() !== '') return 'already-recorded';
      // The page's own Add button refuses other day flags (e.g. "X" on rest days).
      if (!['1', '9', '0', ''].includes(form.dayFlag)) {
        throw new ServiceUnavailableException(
          `N-PAX does not take allocations on ${day.date} (day flag ${form.dayFlag})`,
        );
      }

      const alerts: string[] = [];
      const onDialog = (dialog: Dialog) => void alerts.push(dialog.message());
      page.on('dialog', onDialog);
      try {
        const entries = [...day.entries].sort(
          (a, b) => a.startMinutes - b.startMinutes,
        );
        for (const [i, entry] of entries.entries()) {
          if (i > 0) await page.evaluate('Addk("tst")');
          const rowIndex = await page.evaluate((n) => {
            const table = document.getElementById('tst') as HTMLTableElement;
            const rows = Array.from(table.rows).filter(
              (r) => r.cells.length > 5,
            );
            return rows[n]?.rowIndex ?? -1;
          }, i);
          if (rowIndex < 0) {
            throw new ServiceUnavailableException(
              `N-PAX would not add row ${i + 1} for ${day.date}${alerts.length ? `: ${alerts.join(' / ')}` : ''}`,
            );
          }

          await page.evaluate(
            (row, start, end) => {
              const w = window as unknown as {
                position: number;
                formatCompute: () => void;
              };
              w.position = row;
              const table = document.getElementById('tst') as HTMLTableElement;
              const inputs = table.rows[row].getElementsByTagName('input');
              inputs[1].value = start;
              inputs[2].value = end;
              w.formatCompute();
            },
            rowIndex,
            toClock24(entry.startMinutes),
            toClock24(entry.endMinutes),
          );
          await this.pickFromLookup(
            page,
            rowIndex,
            'lookupJSJobCode',
            'dgvResult',
            entry.jobCode as string,
            'Job',
          );
          await this.pickFromLookup(
            page,
            rowIndex,
            'lookupJSSubWork',
            'GridView1',
            entry.workActivityCode as string,
            'Work Activity',
          );
          await page.evaluate(
            (row, particulars, billableInput, yesInput) => {
              const table = document.getElementById('tst') as HTMLTableElement;
              const inputs = table.rows[row].getElementsByTagName('input');
              // The site only records billable when the radio is clicked; mirror it.
              inputs[billableInput].value = inputs[yesInput].checked
                ? 'True'
                : 'False';
              const box =
                table.rows[row + 1].getElementsByTagName('textarea')[0];
              box.value = particulars;
            },
            rowIndex,
            // "|$|" separates rows when the page posts them; keep it out of the text.
            // N-PAX keeps particulars in uppercase, including entries saved before the form enforced it.
            entry.description.replace(/\|\$\|/g, '| $ |').toUpperCase(),
            HBILLABLE_INPUT,
            RBL_BILLABLE_YES_INPUT,
          );
        }

        const complete = await page.evaluate('checkEntry("tst")');
        if (complete !== true) {
          throw new ServiceUnavailableException(
            `N-PAX form for ${day.date} is incomplete after filling it${alerts.length ? `: ${alerts.join(' / ')}` : ''}`,
          );
        }
        await page.evaluate('SplitRemarks()');

        if (options.screenshotPath) {
          await page.screenshot({
            path: options.screenshotPath,
            fullPage: true,
          });
        }
        if (options.dryRun) return 'dry-run';

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          page.click(SAVE_BUTTON),
        ]);
        const saved = await page
          .$eval(
            '#ctl00_ContentPlaceHolder1_txtJStart',
            (el) => (el as HTMLInputElement).value,
          )
          .catch(() => '');
        if (!saved.includes(toClock24(entries[0].startMinutes))) {
          throw new ServiceUnavailableException(
            `N-PAX did not keep the ${day.date} allocation${alerts.length ? `: ${alerts.join(' / ')}` : ''}`,
          );
        }
        return 'saved';
      } finally {
        page.off('dialog', onDialog);
      }
    });
  }

  /**
   * Opens a row's lookup popup the way its search button does, finds the row
   * whose first column is `code` (searching, then trying each cost center if
   * it isn't listed), and double-click-selects it so the popup fills the row.
   */
  private async pickFromLookup(
    page: Page,
    rowIndex: number,
    openFunction: string,
    tableId: string,
    code: string,
    label: string,
  ): Promise<void> {
    const popupPromise = waitForPopup(page);
    await page.evaluate(
      (row, fn) => {
        const w = window as unknown as Record<string, unknown> & {
          position: number;
        };
        w.position = row;
        (w[fn] as () => void)();
      },
      rowIndex,
      openFunction,
    );
    const popup = await popupPromise;
    if (!popup) {
      throw new ServiceUnavailableException(
        `The N-PAX ${label} lookup did not open`,
      );
    }

    const findRow = () =>
      popup.evaluate(
        (id, wanted) => {
          const table = document.getElementById(id) as HTMLTableElement | null;
          if (!table) return -1;
          for (let r = 1; r < table.rows.length; r++) {
            if (table.rows[r].cells[0]?.textContent?.trim() === wanted) {
              return r - 1;
            }
          }
          return -1;
        },
        tableId,
        code,
      );
    // Lookup filters post back on change, which reloads the popup.
    const postBack = (selector: string, value: string) =>
      Promise.all([
        popup.waitForNavigation({ waitUntil: 'load' }),
        popup.evaluate(
          (sel, val) => {
            const el = document.querySelector(sel) as
              HTMLInputElement | HTMLSelectElement;
            el.value = val;
            el.dispatchEvent(new Event('change'));
          },
          selector,
          value,
        ),
      ]);

    try {
      await popup.waitForSelector('#txtSearch');
      let index = await findRow();
      if (index < 0) {
        await postBack('#txtSearch', code);
        index = await findRow();
      }
      if (index < 0) {
        const costCenters = await popup
          .$$eval('#ddlCostCenter option', (options) =>
            options.map((o) => o.value),
          )
          .catch(() => [] as string[]);
        for (const costCenter of costCenters) {
          await postBack('#ddlCostCenter', costCenter);
          index = await findRow();
          if (index >= 0) break;
        }
      }
      if (index < 0) {
        throw new ServiceUnavailableException(
          `${code} is not in the N-PAX ${label} lookup`,
        );
      }

      const closed = new Promise<void>((resolve) =>
        popup.once('close', () => resolve()),
      );
      await popup
        .evaluate((i) => {
          (
            window as unknown as {
              SendValueToParent2: (index: string) => boolean;
            }
          ).SendValueToParent2(String(i));
        }, index)
        // The popup closes itself mid-call.
        .catch(ignoreNavigationError);
      await Promise.race([closed, delay(5_000)]);
    } finally {
      if (!popup.isClosed()) await popup.close().catch(() => undefined);
    }
  }

  /**
   * Saves the HTML of the allocation pages (Modification and Entry, every
   * frame), the site's own scripts they load (e.g. _manhour.js), and each
   * lookup page linked from either (e.g. lookupJSJobCode.aspx), for mapping
   * the form. Read-only: pages are only loaded, nothing is clicked or submitted.
   */
  capturePages(): Promise<NpaxCapturedPage[]> {
    return this.enqueue(async () => {
      const page = await this.openJobSplitPage();
      const captured: NpaxCapturedPage[] = [];
      const captureFrames = async (prefix: string) => {
        for (const [i, frame] of page.frames().entries()) {
          captured.push({
            name: i === 0 ? prefix : `${prefix}-frame-${i}`,
            url: frame.url(),
            html: await frame.content(),
          });
        }
      };
      await captureFrames('allocation-modification');
      await page.goto(this.baseUrl + ALLOCATION_ENTRY_PATH, {
        waitUntil: 'load',
      });
      await captureFrames('allocation-entry');

      // The Job lookup only lists jobs when the form opens it, so open it the
      // way the row's search button does and save the popup (nothing is picked).
      const popup = new Promise<Page | null>((resolve) => {
        const timer = setTimeout(() => resolve(null), NAV_TIMEOUT_MS);
        page.browserContext().once('targetcreated', (target) => {
          clearTimeout(timer);
          void target.page().then(resolve, () => resolve(null));
        });
      });
      await page.evaluate(
        'typeof lookupJSJobCode === "function" && lookupJSJobCode()',
      );
      const jobLookup = await popup;
      if (jobLookup) {
        try {
          await jobLookup
            .waitForNetworkIdle({ timeout: NAV_TIMEOUT_MS })
            .catch(() => undefined);
          captured.push({
            name: 'job-lookup-from-form',
            url: jobLookup.url(),
            html: await jobLookup.content(),
          });
        } finally {
          await jobLookup.close().catch(() => undefined);
        }
      } else {
        this.logger.warn('The Job lookup popup did not open');
      }

      // The Work Activity lookup takes the employee's cost center and the job
      // category (B = billable, N = non-billable).
      const costCenterId = await page
        .$eval(
          '#ctl00_ContentPlaceHolder1_hfEmployeeCostCenter',
          (el) => (el as HTMLInputElement).value,
        )
        .catch(() => '');
      const workActivityLookups = ['B', 'N'].map(
        (cat) =>
          `${this.baseUrl}/Transactions/ManhourAllocation/pgeLookupSubWork.aspx?cct=${encodeURIComponent(costCenterId)}&cat=${cat}`,
      );
      // Sub Act. Codes, required for activities whose FBS code ends in |$|.
      for (const activity of ['DEV', 'QA']) {
        workActivityLookups.push(
          `${this.baseUrl}/Transactions/ManhourAllocation/lookupJSMenuCode.aspx?cct=&cat=${activity}`,
        );
      }

      const extraPage = await openPage(page.browserContext());
      try {
        // The site's own scripts (not ASP.NET's WebResource.axd bundles).
        const scriptUrls = new Set<string>();
        for (const { html, url } of [...captured]) {
          for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/gi)) {
            const src = new URL(match[1].replace(/&amp;/g, '&'), url);
            if (
              src.host === new URL(url).host &&
              !/\.axd$/i.test(src.pathname)
            ) {
              scriptUrls.add(src.href);
            }
          }
        }
        for (const url of scriptUrls) {
          try {
            const response = await extraPage.goto(url, { waitUntil: 'load' });
            captured.push({
              name: new URL(url).pathname.split('/').pop() ?? 'script.js',
              url,
              html: (await response?.text()) ?? '',
            });
          } catch (error) {
            this.logger.warn(
              `Could not load ${url}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        // Lookup popups are opened by script, so find their URLs in the source.
        const lookupUrls = new Set<string>(workActivityLookups);
        for (const { html, url } of captured) {
          for (const match of html.matchAll(
            /[\w./-]*lookup\w*\.aspx[^'"\s<>)]*/gi,
          )) {
            try {
              lookupUrls.add(
                new URL(match[0].replace(/&amp;/g, '&'), url).href,
              );
            } catch {
              // Not a usable URL (e.g. built by string concatenation); skip it.
            }
          }
        }

        for (const url of lookupUrls) {
          const name = new URL(url).pathname.split('/').pop() ?? 'lookup';
          try {
            await extraPage.goto(url, { waitUntil: 'load' });
            captured.push({ name, url, html: await extraPage.content() });
          } catch (error) {
            this.logger.warn(
              `Could not load ${url}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      } finally {
        await extraPage.close().catch(() => undefined);
      }
      return captured;
    });
  }

  /**
   * Tries to log in with the given credentials in a throwaway browser context,
   * so the shared session's cookies are never touched. Resolves false when the
   * site rejects the login; throws when the site itself can't be reached.
   */
  verifyLogin(userId: string, password: string): Promise<boolean> {
    return this.enqueue(async () => {
      const context = await (await this.getBrowser()).createBrowserContext();
      try {
        const page = await openPage(context);
        await page.goto(this.baseUrl + LOGIN_PATH, { waitUntil: 'load' });
        await this.signIn(page, userId, password);
        return !this.isOnLoginPage(page);
      } catch (error) {
        // A login form that never navigates means the site refused it inline.
        if (error instanceof TimeoutError) return false;
        throw error;
      } finally {
        await context.close().catch(() => undefined);
      }
    });
  }

  getStatus(): NpaxSessionStatus {
    return { ...this.status };
  }

  /**
   * Logs in with these credentials and, if the site accepts them, makes that
   * login the shared session (replacing any previous one). Resolves false when
   * the site rejects them; throws when the site can't be reached.
   */
  connect(userId: string, password: string): Promise<boolean> {
    return this.enqueue(async () => {
      const context = await (await this.getBrowser()).createBrowserContext();
      try {
        const page = await openPage(context);
        await page.goto(this.baseUrl + LOGIN_PATH, { waitUntil: 'load' });
        await this.signIn(page, userId, password);
        if (this.isOnLoginPage(page)) {
          await context.close().catch(() => undefined);
          return false;
        }
        await this.closeSession();
        this.context = context;
        this.page = page;
        this.login = { userId, password };
        this.markConnected();
        return true;
      } catch (error) {
        await context.close().catch(() => undefined);
        if (error instanceof TimeoutError) return false;
        throw error;
      }
    });
  }

  /**
   * Takes a previously saved login without logging in yet; the next
   * `keepAlive` signs in with it (and drops it if the site rejects it).
   */
  restoreLogin(userId: string, password: string): void {
    this.login = { userId, password };
    this.setStatus('reconnecting', userId, 'Restoring the saved login');
  }

  /** Forgets the connected login and closes its browser session. */
  disconnect(): Promise<NpaxSessionStatus> {
    return this.enqueue(async () => {
      this.login = null;
      await this.closeSession();
      this.setStatus('disconnected', null, null);
      return this.getStatus();
    });
  }

  /**
   * Loads a signed-in page so the site's idle timer resets. If the session has
   * expired, logs in again, retrying with backoff. Gives up on the login (and
   * disconnects) only when every attempt was rejected by the site; network
   * failures leave it 'unreachable' so the next check tries again.
   */
  keepAlive(): Promise<NpaxSessionStatus> {
    return this.enqueue(async () => {
      const login = this.login;
      if (!login) return this.getStatus();

      const attempts = Math.max(
        1,
        Number(
          this.config.get('NPAX_RELOGIN_ATTEMPTS') ?? DEFAULT_RELOGIN_ATTEMPTS,
        ),
      );
      let rejections = 0;
      let lastError = '';

      for (let attempt = 1; attempt <= attempts; attempt++) {
        if (attempt > 1) await delay(RELOGIN_BACKOFF_MS * 2 ** (attempt - 2));
        try {
          const page = await this.getPage();
          await page.goto(this.baseUrl + JOB_SPLIT_PATH, { waitUntil: 'load' });
          if (!this.isOnLoginPage(page)) {
            this.markConnected();
            return this.getStatus();
          }

          this.logger.warn(
            `N-PAX session expired; logging in again (attempt ${attempt}/${attempts})`,
          );
          this.setStatus('reconnecting', login.userId, 'Session expired');
          await this.signIn(page, login.userId, login.password);
          await page.goto(this.baseUrl + JOB_SPLIT_PATH, { waitUntil: 'load' });
          if (!this.isOnLoginPage(page)) {
            this.markConnected();
            return this.getStatus();
          }
          rejections++;
          lastError = 'The site rejected the saved login';
        } catch (error) {
          // A broken page is recreated on the next attempt.
          await this.page?.close().catch(() => undefined);
          this.page = null;
          lastError = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `N-PAX keep-alive attempt ${attempt} failed: ${lastError}`,
          );
        }
      }

      if (rejections === attempts) {
        this.logger.error('N-PAX rejected the saved login; disconnecting');
        this.login = null;
        await this.closeSession();
        this.setStatus(
          'disconnected',
          null,
          'The site rejected the saved login. Connect again.',
        );
      } else {
        this.setStatus('unreachable', login.userId, lastError);
      }
      return this.getStatus();
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private get baseUrl(): string {
    return this.config.getOrThrow<string>('NPAX_BASE_URL').replace(/\/$/, '');
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser?.connected) {
      this.context = null;
      this.page = null;
      this.browser = await puppeteer.launch({ headless: true });
    }
    return this.browser;
  }

  private async getPage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) return this.page;
    const browser = await this.getBrowser();
    this.context ??= await browser.createBrowserContext();
    this.page = await openPage(this.context);
    return this.page;
  }

  private async closeSession(): Promise<void> {
    await this.context?.close().catch(() => undefined);
    this.context = null;
    this.page = null;
  }

  private markConnected(): void {
    this.setStatus('connected', this.login?.userId ?? null, null);
  }

  private setStatus(
    state: NpaxSessionState,
    userId: string | null,
    message: string | null,
  ): void {
    this.status = {
      state,
      userId,
      checkedAt:
        state === 'connected'
          ? new Date().toISOString()
          : this.status.checkedAt,
      message,
    };
  }

  /** The connected login; there is none until someone connects from the desktop. */
  private getLogin(): NpaxLogin {
    if (this.login) return this.login;
    throw new ServiceUnavailableException(
      'Not connected to N-PAX. Connect from the desktop app first.',
    );
  }

  private openJobSplitPage(): Promise<Page> {
    return this.openSignedInPage(JOB_SPLIT_PATH);
  }

  /** Loads a site page on the shared session, logging in first if it has expired. */
  private async openSignedInPage(path: string): Promise<Page> {
    const page = await this.getPage();
    await page.goto(this.baseUrl + path, { waitUntil: 'load' });
    if (this.isOnLoginPage(page)) {
      const { userId, password } = this.getLogin();
      await this.signIn(page, userId, password);
      await page.goto(this.baseUrl + path, { waitUntil: 'load' });
      if (this.isOnLoginPage(page)) {
        throw new ServiceUnavailableException('N-PAX login failed');
      }
    }
    return page;
  }

  private isOnLoginPage(page: Page): boolean {
    const path = new URL(page.url()).pathname.toLowerCase();
    return path === '/' || path.endsWith(LOGIN_PATH);
  }

  private async signIn(
    page: Page,
    userId: string,
    password: string,
  ): Promise<void> {
    this.logger.log('Logging in to N-PAX workflow');
    if (!page.url().toLowerCase().endsWith(LOGIN_PATH)) {
      await page.goto(this.baseUrl + LOGIN_PATH, { waitUntil: 'load' });
    }

    await page.type('#txtActiveDirectory', userId);
    // Leaving the User ID box can post back (to load the account's profiles).
    // Let that reload finish, or the password lands on a page that is going away.
    const postback = page
      .waitForNavigation({ waitUntil: 'load', timeout: POSTBACK_GRACE_MS })
      .catch(() => null);
    await page.focus('#txtPassword').catch(ignoreNavigationError);
    await postback;
    await page.type('#txtPassword', password);
    await this.submitLogin(page);

    // Some accounts land back on the login page with a profile to pick.
    const profileEnabled = await page
      .$eval('#ddlProfiles', (el) => !(el as HTMLSelectElement).disabled)
      .catch(() => false);
    if (this.isOnLoginPage(page) && profileEnabled) {
      const profile = this.config.get<string>('NPAX_PROFILE');
      if (profile) await page.select('#ddlProfiles', profile);
      await this.submitLogin(page);
    }
  }

  private async submitLogin(page: Page): Promise<void> {
    const navigation = page.waitForNavigation({ waitUntil: 'load' });
    // The click itself starts the navigation, which can tear down the context
    // Puppeteer is still using to finish the click.
    await page.click('#btnLogin').catch(ignoreNavigationError);
    await navigation;
  }

  private async selectDate(page: Page, date: Date): Promise<void> {
    const dayArg = String(
      Math.round(
        (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
          CALENDAR_EPOCH_UTC) /
          86_400_000,
      ),
    );

    for (let i = 0; i <= MAX_MONTHS_BACK; i++) {
      const dayLink = await page.$(`a[href*="'${dayArg}')"]`);
      if (dayLink) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load' }),
          dayLink.click(),
        ]);
        return;
      }
      const prevLink = await page.$('a[title="Go to the previous month"]');
      if (!prevLink) break;
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        prevLink.click(),
      ]);
    }

    throw new ServiceUnavailableException(
      `Date ${date.toDateString()} is not selectable in the N-PAX calendar`,
    );
  }

  /**
   * Finds the text input rendered next to a label (to its right, or directly
   * under it for column headers). Matches by on-screen position because the
   * page's control ids are generated.
   */
  private readInputNearLabel(
    page: Page,
    label: string,
    direction: 'right' | 'below',
  ): Promise<string | null> {
    return page.evaluate(
      (text, dir) => {
        const labelEl = Array.from(
          document.querySelectorAll<HTMLElement>('td, th, span, label'),
        ).find((el) => el.textContent?.trim() === text);
        if (!labelEl) return null;

        const box = labelEl.getBoundingClientRect();
        let best: HTMLInputElement | null = null;
        let bestDistance = Infinity;
        for (const input of Array.from(
          document.querySelectorAll<HTMLInputElement>('input[type="text"]'),
        )) {
          const r = input.getBoundingClientRect();
          const gap = dir === 'below' ? r.top - box.bottom : r.left - box.right;
          if (gap < 0 || gap > (dir === 'below' ? 40 : 200)) continue;
          const offset =
            dir === 'below'
              ? Math.abs(r.left + r.width / 2 - (box.left + box.width / 2))
              : Math.abs(r.top + r.height / 2 - (box.top + box.height / 2));
          if (offset > (dir === 'below' ? 60 : 12)) continue;
          if (gap + offset < bestDistance) {
            best = input;
            bestDistance = gap + offset;
          }
        }
        return best?.value ?? null;
      },
      label,
      direction,
    );
  }
}

/**
 * A page that closes the site's alert() popups on its own. N-PAX alerts
 * "Session timed out. Please re-login." when an expired session is redirected
 * to the login page; an unanswered alert blocks the page, so its load event
 * never fires and every navigation times out.
 */
async function openPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  page.setDefaultTimeout(NAV_TIMEOUT_MS);
  page.on('dialog', (dialog) => void dialog.dismiss().catch(() => undefined));
  return page;
}

/** Swallows the error Puppeteer throws when a page navigates mid-call; rethrows anything else. */
function ignoreNavigationError(error: unknown): void {
  if (
    error instanceof Error &&
    /Execution context was destroyed|detached Frame/i.test(error.message)
  ) {
    return;
  }
  throw error;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 545 → "09:05", the 24-hour form the allocation rows take. */
function toClock24(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Resolves with the next window the page opens (null if none opens in time). */
function waitForPopup(page: Page): Promise<Page | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), NAV_TIMEOUT_MS);
    page.once('popup', (popup) => {
      clearTimeout(timer);
      if (!popup) return resolve(null);
      popup.setDefaultTimeout(NAV_TIMEOUT_MS);
      popup.on('dialog', (d) => void d.dismiss().catch(() => undefined));
      resolve(popup);
    });
  });
}
