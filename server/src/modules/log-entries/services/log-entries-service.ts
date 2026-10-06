import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogEntry } from '../../../infrastructures/prisma/common/client';
import { formatClock } from '../../../shared/utils/date-key-utils';
import {
  CreateLogEntryDto,
  ListLogEntriesQueryDto,
  LogEntryResponseDto,
  UpdateLogEntryDto,
} from '../dto/log-entries-dto';
import { LogEntriesRepository } from '../repositories/log-entries-repository';

@Injectable()
export class LogEntriesService {
  constructor(private readonly repository: LogEntriesRepository) {}

  async list(
    user: string,
    query: ListLogEntriesQueryDto,
  ): Promise<LogEntryResponseDto[]> {
    const entries = await this.repository.findBetween(
      user,
      query.from,
      query.to,
    );
    return entries.map(toResponse);
  }

  async create(
    user: string,
    data: CreateLogEntryDto,
  ): Promise<LogEntryResponseDto> {
    await this.assertNoOverlap(user, data.date, data, null);
    return toResponse(await this.repository.create(user, data));
  }

  async update(
    user: string,
    id: string,
    data: UpdateLogEntryDto,
  ): Promise<LogEntryResponseDto> {
    const existing = await this.getOrThrow(user, id);
    await this.assertNoOverlap(user, existing.date, data, id);
    return toResponse(await this.repository.update(id, data));
  }

  async remove(user: string, id: string): Promise<{ id: string }> {
    const entry = await this.getOrThrow(user, id);
    await this.repository.delete(id);
    // N-PAX still has the deleted entry; upload the rest of the day to replace it.
    if (entry.syncedAt) await this.repository.markDayUnsynced(user, entry.date);
    return { id };
  }

  /**
   * Marks every entry on the given days unsynced, so the next sync uploads
   * those days again. Days without entries are left out of the result.
   */
  async resyncDays(
    user: string,
    dates: string[],
  ): Promise<{ dates: string[]; entryCount: number }> {
    const entries = await this.repository.markDaysUnsynced(user, dates);
    if (entries.length === 0) {
      throw new NotFoundException('No entries on those days to sync');
    }
    return {
      dates: [...new Set(entries.map((e) => e.date))].sort(),
      entryCount: entries.length,
    };
  }

  /** Another user's entry is reported as not found, the same as a missing one. */
  private async getOrThrow(user: string, id: string): Promise<LogEntry> {
    const entry = await this.repository.findById(user, id);
    if (!entry) throw new NotFoundException('Entry not found');
    return entry;
  }

  /** Entries on one day may touch end-to-start but never overlap. */
  private async assertNoOverlap(
    user: string,
    date: string,
    range: { startMinutes: number; endMinutes: number },
    ignoreId: string | null,
  ): Promise<void> {
    const clash = (await this.repository.findByDate(user, date)).find(
      (e) =>
        e.id !== ignoreId &&
        range.startMinutes < e.endMinutes &&
        range.endMinutes > e.startMinutes,
    );
    if (clash) {
      throw new ConflictException(
        `Overlaps ${formatClock(clash.startMinutes)} – ${formatClock(clash.endMinutes)} entry.`,
      );
    }
  }
}

function toResponse(entry: LogEntry): LogEntryResponseDto {
  return {
    id: entry.id,
    date: entry.date,
    startMinutes: entry.startMinutes,
    endMinutes: entry.endMinutes,
    description: entry.description,
    workActivityCode: entry.workActivityCode,
    jobCode: entry.jobCode,
    syncedAt: entry.syncedAt?.toISOString() ?? null,
  };
}
