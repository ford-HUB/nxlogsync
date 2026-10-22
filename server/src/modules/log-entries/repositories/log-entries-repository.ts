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

  /**
   * The user's entries not yet saved to N-PAX, up to and including `throughDate`.
   * Endorsed days are left out: N-PAX won't take them again.
   */
  async findUnsynced(userId: string, throughDate: string): Promise<LogEntry[]> {
    const endorsed = await this.findEndorsedDates(userId);
    return this.prisma.logEntry.findMany({
      where: {
        userId,
        syncedAt: null,
        date: { lte: throughDate, notIn: endorsed },
      },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  /** Entries up to and including `throughDate` that N-PAX holds; a day flagged for resync drops out until it uploads again. */
  countSynced(userId: string, throughDate: string): Promise<number> {
    return this.prisma.logEntry.count({
      where: { userId, syncedAt: { not: null }, date: { lte: throughDate } },
    });
  }

  create(userId: string, data: CreateLogEntryDto): Promise<LogEntry> {
    return this.prisma.logEntry.create({ data: { ...data, userId } });
  }

  /**
   * Every entry on each day, up to and including `throughDate`, that has at
   * least one entry not yet saved to N-PAX. A sync replaces the whole day on
   * N-PAX, so it must send the day's synced entries along with the new ones.
   * Endorsed days are left out: N-PAX won't let them be cleared or saved over.
   */
  async findDaysToSync(
    userId: string,
    throughDate: string,
  ): Promise<LogEntry[]> {
    const endorsed = await this.findEndorsedDates(userId);
    const days = await this.prisma.logEntry.findMany({
      where: {
        userId,
        syncedAt: null,
        date: { lte: throughDate, notIn: endorsed },
      },
      select: { date: true },
      distinct: ['date'],
    });
    return this.prisma.logEntry.findMany({
      where: { userId, date: { in: days.map((d) => d.date) } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  /**
   * Callers check ownership with findById first. An edited entry must be uploaded again;
   * `editedSinceSync` says whether N-PAX already holds an older copy of it.
   */
  update(
    id: string,
    data: UpdateLogEntryDto,
    editedSinceSync: boolean,
  ): Promise<LogEntry> {
    return this.prisma.logEntry.update({
      where: { id },
      data: { ...data, syncedAt: null, editedSinceSync },
    });
  }

  /** Callers check ownership first. Moves the entries together, as update does each. */
  reschedule(
    moves: {
      id: string;
      startMinutes: number;
      endMinutes: number;
      editedSinceSync: boolean;
    }[],
  ): Promise<LogEntry[]> {
    return this.prisma.$transaction(
      moves.map(({ id, startMinutes, endMinutes, editedSinceSync }) =>
        this.prisma.logEntry.update({
          where: { id },
          data: { startMinutes, endMinutes, syncedAt: null, editedSinceSync },
        }),
      ),
    );
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

  /**
   * As markDaysUnsynced, for a resync the user asked for: also counts the
   * attempt on each entry. Resolves to the entries marked.
   */
  async markDaysForResync(
    userId: string,
    dates: string[],
  ): Promise<{ date: string }[]> {
    const where = { userId, date: { in: dates } };
    const [, entries] = await this.prisma.$transaction([
      this.prisma.logEntry.updateMany({
        where,
        data: { syncedAt: null, resyncCount: { increment: 1 } },
      }),
      this.prisma.logEntry.findMany({ where, select: { date: true } }),
    ]);
    return entries;
  }

  /** Callers check ownership with findById first. */
  delete(id: string): Promise<LogEntry> {
    return this.prisma.logEntry.delete({ where: { id } });
  }

  /** Days the user has endorsed on N-PAX. */
  private async findEndorsedDates(userId: string): Promise<string[]> {
    const days = await this.prisma.logEntry.findMany({
      where: { userId, endorsedAt: { not: null } },
      select: { date: true },
      distinct: ['date'],
    });
    return days.map((d) => d.date);
  }

  /** Entries on days not yet endorsed, up to and including `throughDate`. */
  async findUnendorsed(
    userId: string,
    throughDate: string,
  ): Promise<LogEntry[]> {
    const endorsed = await this.findEndorsedDates(userId);
    return this.prisma.logEntry.findMany({
      where: { userId, date: { lte: throughDate, notIn: endorsed } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  /** Flags every entry on the day as endorsed on N-PAX. */
  async markDayEndorsed(userId: string, date: string, at: Date): Promise<void> {
    await this.prisma.logEntry.updateMany({
      where: { userId, date },
      data: { endorsedAt: at },
    });
  }

  async markSynced(ids: string[], at: Date): Promise<void> {
    await this.prisma.logEntry.updateMany({
      where: { id: { in: ids } },
      data: { syncedAt: at, editedSinceSync: false },
    });
  }
}
