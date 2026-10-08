import { Injectable } from '@nestjs/common';
import { ReminderSetting } from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { ReminderSettingsDto } from '../dto/reminders-dto';

/**
 * One reminder row per user, keyed by the user's key (see toUserKey), created
 * with the column defaults the first time it is read.
 */
@Injectable()
export class RemindersRepository {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string): Promise<ReminderSetting> {
    return this.prisma.reminderSetting.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  /** Every switched-on reminder, for the scheduler. */
  listEnabled(): Promise<ReminderSetting[]> {
    return this.prisma.reminderSetting.findMany({ where: { enabled: true } });
  }

  save(userId: string, data: ReminderSettingsDto): Promise<ReminderSetting> {
    return this.prisma.reminderSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  saveEmail(userId: string, email: string | null): Promise<ReminderSetting> {
    const data = { email, emailFetchedAt: new Date() };
    return this.prisma.reminderSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async markSent(userId: string, date: string): Promise<void> {
    await this.prisma.reminderSetting.update({
      where: { userId },
      data: { lastSentDate: date },
    });
  }

  async markNudged(userId: string, date: string): Promise<void> {
    await this.prisma.reminderSetting.update({
      where: { userId },
      data: { lastNudgeDate: date },
    });
  }
}
