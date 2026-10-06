import { Injectable } from '@nestjs/common';
import { LogEntry } from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { CreateLogEntryDto, UpdateLogEntryDto } from '../dto/log-entries-dto';

/** Every query is scoped to one user (their key, see toUserKey); no user sees another's entries. */
@Injectable()
export class LogEntriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBetween(userId: string, from: string, to: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  findByDate(userId: string, date: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { userId, date },
      orderBy: { startMinutes: 'asc' },
    });
  }

  findById(userId: string, id: string): Promise<LogEntry | null> {
    return this.prisma.logEntry.findFirst({ where: { id, userId } });
  }

  /** The user's entries not yet saved to N-PAX, up to and including `throughDate`. */
  findUnsynced(userId: string, throughDate: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { userId, syncedAt: null, date: { lte: throughDate } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  create(userId: string, data: CreateLogEntryDto): Promise<LogEntry> {
    return this.prisma.logEntry.create({ data: { ...data, userId } });
  }

  /**
   * Every entry on each day, up to and including `throughDate`, that has at
   * least one entry not yet saved to N-PAX. A sync replaces the whole day on
   * N-PAX, so it must send the day's synced entries along with the new ones.
   */
  async findDaysToSync(
    userId: string,
    throughDate: string,
  ): Promise<LogEntry[]> {
    const days = await this.prisma.logEntry.findMany({
      where: { userId, syncedAt: null, date: { lte: throughDate } },
      select: { date: true },
      distinct: ['date'],
    });
    return this.prisma.logEntry.findMany({
      where: { userId, date: { in: days.map((d) => d.date) } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  /** Callers check ownership with findById first. An edited entry must be uploaded again. */
  update(id: string, data: UpdateLogEntryDto): Promise<LogEntry> {
    return this.prisma.logEntry.update({
      where: { id },
      data: { ...data, syncedAt: null },
    });
  }

  /** Marks a day's entries as not yet on N-PAX, so the next sync uploads the day again. */
  async markDayUnsynced(userId: string, date: string): Promise<void> {
    await this.markDaysUnsynced(userId, [date]);
  }

  /** As markDayUnsynced, for several days; resolves to the entries marked. */
  async markDaysUnsynced(
    userId: string,
    dates: string[],
  ): Promise<{ date: string }[]> {
    const where = { userId, date: { in: dates } };
    const [, entries] = await this.prisma.$transaction([
      this.prisma.logEntry.updateMany({ where, data: { syncedAt: null } }),
      this.prisma.logEntry.findMany({ where, select: { date: true } }),
    ]);
    return entries;
  }

  /** Callers check ownership with findById first. */
  delete(id: string): Promise<LogEntry> {
    return this.prisma.logEntry.delete({ where: { id } });
  }

  async markSynced(ids: string[], at: Date): Promise<void> {
    await this.prisma.logEntry.updateMany({
      where: { id: { in: ids } },
      data: { syncedAt: at },
    });
  }
}
