import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../../infrastructures/mail/mail-service';
import { NpaxWorkflowClient } from '../../../infrastructures/npax-workflow/npax-workflow-client';
import { ReminderSetting } from '../../../infrastructures/prisma/common/client';
import { toDateKey } from '../../../shared/utils/date-key-utils';
import { workMinutes } from '../../../shared/utils/work-minutes-utils';
import {
  ReminderKind,
  ShortDay,
} from '../../../infrastructures/mail/templates/reminder-email-template';
import { LogEntriesRepository } from '../../log-entries/repositories/log-entries-repository';
import {
  ReminderSettingsDto,
  ReminderSettingsResponseDto,
} from '../dto/reminders-dto';
import { RemindersRepository } from '../repositories/reminders-repository';

/** A full day; a work day logged short of this is listed in the reminder. */
const DAY_TARGET_MINUTES = 9 * 60;

/** The work days of a month checked so far, and the ones logged short. */
interface MonthReport {
  from: Date;
  through: Date;
  checkedDays: number;
  shortDays: ShortDay[];
}

/**
 * Emails a user, near the end of each month, the work days they have logged
 * short of a full day, and, when they opt in (`nudge`), on each of their work
 * days while any day so far is short. The address is the Email on
 * N-PAX's Present Address Update, read once on the user's session and kept in
 * reminder_settings; it is only read again when the user asks for a refresh.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly repository: RemindersRepository,
    private readonly logEntries: LogEntriesRepository,
    private readonly npax: NpaxWorkflowClient,
    private readonly mail: MailService,
  ) {}

  async get(user: string): Promise<ReminderSettingsResponseDto> {
    return toResponse(await this.repository.get(user));
  }

  async save(
    user: string,
    data: ReminderSettingsDto,
  ): Promise<ReminderSettingsResponseDto> {
    return toResponse(await this.repository.save(user, data));
  }

  /** Reads the email from N-PAX again and stores it (null when N-PAX shows none). */
  async refreshEmail(user: string): Promise<ReminderSettingsResponseDto> {
    const email = await this.npax.getPresentAddressEmail(user);
    this.logger.log(
      `Read the reminder email for ${user} from N-PAX: ${email ? 'found' : 'none shown'}`,
    );
    return toResponse(await this.repository.saveEmail(user, email));
  }

  /** Sends the month-so-far report now, whatever the hours, so the user can check it arrives. */
  async sendTest(user: string): Promise<{ email: string }> {
    const email = await this.ensureEmail(await this.repository.get(user));
    if (!email) {
      throw new BadRequestException(
        'No email was found on N-PAX (Personnel › Present Address Update)',
      );
    }
    const setting = await this.repository.get(user);
    const now = new Date();
    const report = await this.monthReport(user, setting.days, now, now);
    await this.sendReminder(user, email, report, 'month-end', { test: true });
    return { email };
  }

  listEnabled(): Promise<ReminderSetting[]> {
    return this.repository.listEnabled();
  }

  /**
   * The scheduler's send, on the report day `at` falls on: checks every work
   * day of the whole month, the days still ahead included (flagged upcoming),
   * and emails `setting`'s user the ones logged short of a full day. Records
   * the day either way so it is checked once. True when an email went out.
   */
  async remindIfMonthShort(
    setting: ReminderSetting,
    at: Date,
  ): Promise<boolean> {
    if (setting.lastSentDate === toDateKey(at)) return false;
    return this.remindIfShort(setting, at, 'month-end');
  }

  /**
   * The scheduler's opt-in send on one of the user's work days: the same check
   * as the month-end report, through `at`'s day, recorded separately.
   */
  async nudgeIfShort(setting: ReminderSetting, at: Date): Promise<void> {
    if (setting.lastNudgeDate === toDateKey(at)) return;
    await this.remindIfShort(setting, at, 'day');
  }

  /** True when an email went out. */
  private async remindIfShort(
    setting: ReminderSetting,
    at: Date,
    kind: ReminderKind,
  ): Promise<boolean> {
    const date = toDateKey(at);
    const mark = () =>
      kind === 'day'
        ? this.repository.markNudged(setting.userId, date)
        : this.repository.markSent(setting.userId, date);
    const through =
      kind === 'month-end'
        ? new Date(at.getFullYear(), at.getMonth() + 1, 0)
        : at;
    const report = await this.monthReport(
      setting.userId,
      setting.days,
      through,
      at,
    );
    if (report.shortDays.length === 0) {
      await mark();
      return false;
    }
    const email = await this.ensureEmail(setting);
    if (!email) {
      this.logger.warn(
        `No reminder email for ${setting.userId}: none read from N-PAX yet`,
      );
      return false;
    }
    await this.sendReminder(setting.userId, email, report, kind);
    await mark();
    return true;
  }

  /** The user's email for other notices (e.g. the scheduled sync report); null when none is known. */
  async emailFor(user: string): Promise<string | null> {
    return this.ensureEmail(await this.repository.get(user));
  }

  /** The stored email; read from N-PAX only the first time, while the user is connected. */
  private async ensureEmail(setting: ReminderSetting): Promise<string | null> {
    if (setting.email) return setting.email;
    if (!this.npax.hasLogin(setting.userId)) return null;
    return (await this.refreshEmail(setting.userId)).email;
  }

  /**
   * The work days (`workDays`, Date#getDay() numbering) from the 1st of
   * `through`'s month to `through`; those after `today`'s day are upcoming.
   */
  private async monthReport(
    user: string,
    workDays: number[],
    through: Date,
    today: Date,
  ): Promise<MonthReport> {
    const todayKey = toDateKey(today);
    const from = new Date(through.getFullYear(), through.getMonth(), 1);
    const entries = await this.logEntries.findBetween(
      user,
      toDateKey(from),
      toDateKey(through),
    );
    const logged = new Map<string, number>();
    for (const e of entries) {
      logged.set(
        e.date,
        (logged.get(e.date) ?? 0) + workMinutes(e.startMinutes, e.endMinutes),
      );
    }
    let checkedDays = 0;
    const shortDays: ShortDay[] = [];
    for (
      const day = new Date(from);
      day <= through;
      day.setDate(day.getDate() + 1)
    ) {
      if (!workDays.includes(day.getDay())) continue;
      checkedDays++;
      const key = toDateKey(day);
      const loggedMinutes = logged.get(key) ?? 0;
      if (loggedMinutes < DAY_TARGET_MINUTES) {
        shortDays.push({
          day: new Date(day),
          loggedMinutes,
          upcoming: key > todayKey,
        });
      }
    }
    return { from, through, checkedDays, shortDays };
  }

  private async sendReminder(
    user: string,
    email: string,
    report: MonthReport,
    kind: ReminderKind,
    options: { test?: boolean } = {},
  ): Promise<void> {
    await this.mail.sendReminder({
      to: email,
      ...report,
      kind,
      targetMinutes: DAY_TARGET_MINUTES,
      test: options.test,
    });
    this.logger.log(
      `Sent the ${toDateKey(report.through)} ${options.test ? 'test ' : ''}${kind} reminder to ${user} (${report.shortDays.length} short days)`,
    );
  }
}

function toResponse(setting: ReminderSetting): ReminderSettingsResponseDto {
  return {
    enabled: setting.enabled,
    atMinutes: setting.atMinutes,
    days: setting.days,
    nudge: setting.nudge,
    email: setting.email,
    emailFetchedAt: setting.emailFetchedAt?.toISOString() ?? null,
    lastSentDate: setting.lastSentDate,
    lastNudgeDate: setting.lastNudgeDate,
  };
}
