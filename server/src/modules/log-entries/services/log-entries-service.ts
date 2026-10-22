import {
  BadRequestException,
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
  RescheduleEntriesDto,
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
    await this.assertDaysNotEndorsed(user, [data.date]);
    await this.assertNoOverlap(user, data.date, data, null);
    return toResponse(await this.repository.create(user, data));
  }

  async update(
    user: string,
    id: string,
    data: UpdateLogEntryDto,
  ): Promise<LogEntryResponseDto> {
    const existing = await this.getOrThrow(user, id);
    await this.assertDaysNotEndorsed(user, [existing.date]);
    await this.assertNoOverlap(user, existing.date, data, id);
    // Still edited if it was edited before and no sync has saved it since.
    const editedSinceSync =
      existing.syncedAt !== null || existing.editedSinceSync;
    return toResponse(await this.repository.update(id, data, editedSinceSync));
  }

  /**
   * Moves several of one day's entries in one go, so two tasks can trade
   * places without either passing through an overlap on the way. The day's
   * entries, as moved, must not overlap.
   */
  async reschedule(
    user: string,
    data: RescheduleEntriesDto,
  ): Promise<LogEntryResponseDto[]> {
    await this.assertDaysNotEndorsed(user, [data.date]);
    const day = await this.repository.findByDate(user, data.date);
    const byId = new Map(day.map((e) => [e.id, e]));
    if (data.moves.some((m) => !byId.has(m.id))) {
      throw new NotFoundException('Entry not found on that day');
    }
    const moved = new Map(data.moves.map((m) => [m.id, m]));
    const after = day
      .map((e) => moved.get(e.id) ?? e)
      .sort((a, b) => a.startMinutes - b.startMinutes);
    for (let i = 1; i < after.length; i++) {
      if (after[i].startMinutes < after[i - 1].endMinutes) {
        throw new ConflictException(
          `Overlaps ${formatClock(after[i - 1].startMinutes)} – ${formatClock(after[i - 1].endMinutes)} entry.`,
        );
      }
    }
    const updated = await this.repository.reschedule(
      data.moves.map((m) => {
        const existing = byId.get(m.id)!;
        return {
          ...m,
          editedSinceSync:
            existing.syncedAt !== null || existing.editedSinceSync,
        };
      }),
    );
    return updated.map(toResponse);
  }

  async remove(user: string, id: string): Promise<{ id: string }> {
    const entry = await this.getOrThrow(user, id);
    await this.assertDaysNotEndorsed(user, [entry.date]);
    await this.repository.delete(id);
    // N-PAX still has the deleted entry; upload the rest of the day to replace it.
    if (entry.syncedAt) await this.repository.markDayUnsynced(user, entry.date);
    return { id };
  }

  /**
   * Marks every entry on the given days unsynced, so the next sync uploads
   * those days again, and counts the attempt. Days without entries are left
   * out of the result.
   */
  async resyncDays(
    user: string,
    dates: string[],
  ): Promise<{ dates: string[]; entryCount: number }> {
    await this.assertDaysNotEndorsed(user, dates);
    const entries = await this.repository.markDaysForResync(user, dates);
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

  /**
   * An endorsed day is with the checker on N-PAX, so its entries can't be
   * added to, changed, deleted or uploaded again.
   */
  private async assertDaysNotEndorsed(
    user: string,
    dates: string[],
  ): Promise<void> {
    for (const date of dates) {
      const entries = await this.repository.findByDate(user, date);
      if (entries.some((e) => e.endorsedAt !== null)) {
        throw new BadRequestException(
          `${date} is endorsed on N-PAX and can no longer be changed`,
        );
      }
    }
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
    editedSinceSync: entry.editedSinceSync,
    endorsedAt: entry.endorsedAt?.toISOString() ?? null,
    resyncCount: entry.resyncCount,
  };
}
