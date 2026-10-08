import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoMailClient } from '../../../infrastructures/mail/brevo-mail-client';
import { renderReminderEmail } from '../../../infrastructures/mail/templates/reminder-email-template';
import { NpaxWorkflowClient } from '../../../infrastructures/npax-workflow/npax-workflow-client';
import { ReminderSetting } from '../../../infrastructures/prisma/common/client';
import { toDateKey } from '../../../shared/utils/date-key-utils';
import { workMinutes } from '../../../shared/utils/work-minutes-utils';
import { LogEntriesRepository } from '../../log-entries/repositories/log-entries-repository';
import {
  ReminderSettingsDto,
  ReminderSettingsResponseDto,
} from '../dto/reminders-dto';
import { RemindersRepository } from '../repositories/reminders-repository';

/** A full day; a day logged short of this gets a reminder. */
const DAY_TARGET_MINUTES = 9 * 60;

/**
 * Emails a user a reminder to log their hours. The address is the Email on
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
    private readonly mail: BrevoMailClient,
    private readonly config: ConfigService,
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

  /** Sends today's reminder now, whatever today's hours, so the user can check it arrives. */
  async sendTest(user: string): Promise<{ email: string }> {
    const email = await this.ensureEmail(await this.repository.get(user));
    if (!email) {
      throw new BadRequestException(
        'No email was found on N-PAX (Personnel › Present Address Update)',
      );
    }
    await this.sendReminder(user, email, new Date(), { test: true });
    return { email };
  }

  listEnabled(): Promise<ReminderSetting[]> {
    return this.repository.listEnabled();
  }

  /**
   * The scheduler's send: emails `setting`'s user once for `day` when that day
   * is logged short of a full day. Records the day either way so it is checked once.
   */
  async remindIfShort(setting: ReminderSetting, day: Date): Promise<void> {
    const date = toDateKey(day);
    if (setting.lastSentDate === date) return;
    const logged = await this.loggedMinutes(setting.userId, date);
    if (logged >= DAY_TARGET_MINUTES) {
      await this.repository.markSent(setting.userId, date);
      return;
    }
    const email = await this.ensureEmail(setting);
    if (!email) {
      this.logger.warn(
        `No reminder email for ${setting.userId}: none read from N-PAX yet`,
      );
      return;
    }
    await this.sendReminder(setting.userId, email, day, { logged });
    await this.repository.markSent(setting.userId, date);
  }

  /** The stored email; read from N-PAX only the first time, while the user is connected. */
  private async ensureEmail(setting: ReminderSetting): Promise<string | null> {
    if (setting.email) return setting.email;
    if (!this.npax.hasLogin(setting.userId)) return null;
    return (await this.refreshEmail(setting.userId)).email;
  }

  private async loggedMinutes(user: string, date: string): Promise<number> {
    const entries = await this.logEntries.findByDate(user, date);
    return entries.reduce(
      (sum, e) => sum + workMinutes(e.startMinutes, e.endMinutes),
      0,
    );
  }

  private async sendReminder(
    user: string,
    email: string,
    day: Date,
    options: { logged?: number; test?: boolean } = {},
  ): Promise<void> {
    const loggedMinutes =
      options.logged ?? (await this.loggedMinutes(user, toDateKey(day)));
    await this.mail.send(
      renderReminderEmail({
        to: email,
        day,
        loggedMinutes,
        targetMinutes: DAY_TARGET_MINUTES,
        test: options.test,
        logoUrl: this.config.get<string>('MAIL_LOGO_URL') || undefined,
      }),
    );
    this.logger.log(
      `Sent the ${toDateKey(day)} ${options.test ? 'test ' : ''}reminder to ${user}`,
    );
  }
}

function toResponse(setting: ReminderSetting): ReminderSettingsResponseDto {
  return {
    enabled: setting.enabled,
    atMinutes: setting.atMinutes,
    days: setting.days,
    email: setting.email,
    emailFetchedAt: setting.emailFetchedAt?.toISOString() ?? null,
    lastSentDate: setting.lastSentDate,
  };
}
