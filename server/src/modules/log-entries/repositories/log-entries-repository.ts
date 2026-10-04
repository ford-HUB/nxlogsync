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

  /** Callers check ownership with findById first. */
  update(id: string, data: UpdateLogEntryDto): Promise<LogEntry> {
    return this.prisma.logEntry.update({ where: { id }, data });
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
