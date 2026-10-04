import { Injectable } from '@nestjs/common';
import { LogEntry } from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { CreateLogEntryDto, UpdateLogEntryDto } from '../dto/log-entries-dto';

@Injectable()
export class LogEntriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBetween(from: string, to: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  findByDate(date: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { date },
      orderBy: { startMinutes: 'asc' },
    });
  }

  findById(id: string): Promise<LogEntry | null> {
    return this.prisma.logEntry.findUnique({ where: { id } });
  }

  /** Entries not yet saved to N-PAX, up to and including `throughDate`. */
  findUnsynced(throughDate: string): Promise<LogEntry[]> {
    return this.prisma.logEntry.findMany({
      where: { syncedAt: null, date: { lte: throughDate } },
      orderBy: [{ date: 'asc' }, { startMinutes: 'asc' }],
    });
  }

  create(data: CreateLogEntryDto): Promise<LogEntry> {
    return this.prisma.logEntry.create({ data });
  }

  update(id: string, data: UpdateLogEntryDto): Promise<LogEntry> {
    return this.prisma.logEntry.update({ where: { id }, data });
  }

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
