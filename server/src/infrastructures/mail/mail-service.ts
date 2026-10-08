import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoMailClient } from './brevo-mail-client';
import {
  ReminderEmailData,
  renderReminderEmail,
} from './templates/reminder-email-template';
import {
  SyncReportEmailData,
  renderSyncReportEmail,
} from './templates/sync-report-email-template';

/**
 * Renders NXLogSync's emails and hands them to Brevo. Callers pass the data;
 * branding (MAIL_LOGO_URL) and transport stay in here.
 */
@Injectable()
export class MailService {
  constructor(
    private readonly client: BrevoMailClient,
    private readonly config: ConfigService,
  ) {}

  async sendReminder(data: Omit<ReminderEmailData, 'logoUrl'>): Promise<void> {
    await this.client.send(
      renderReminderEmail({
        ...data,
        logoUrl: this.config.get<string>('MAIL_LOGO_URL') || undefined,
      }),
    );
  }

  async sendSyncReport(
    data: Omit<SyncReportEmailData, 'logoUrl'>,
  ): Promise<void> {
    await this.client.send(
      renderSyncReportEmail({
        ...data,
        logoUrl: this.config.get<string>('MAIL_LOGO_URL') || undefined,
      }),
    );
  }
}
