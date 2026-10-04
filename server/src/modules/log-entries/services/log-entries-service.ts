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

  async list(query: ListLogEntriesQueryDto): Promise<LogEntryResponseDto[]> {
    const entries = await this.repository.findBetween(query.from, query.to);
    return entries.map(toResponse);
  }

  async create(data: CreateLogEntryDto): Promise<LogEntryResponseDto> {
    await this.assertNoOverlap(data.date, data, null);
    return toResponse(await this.repository.create(data));
  }

  async update(
    id: string,
    data: UpdateLogEntryDto,
  ): Promise<LogEntryResponseDto> {
    const existing = await this.getOrThrow(id);
    await this.assertNoOverlap(existing.date, data, id);
    return toResponse(await this.repository.update(id, data));
  }

  async remove(id: string): Promise<{ id: string }> {
    await this.getOrThrow(id);
    await this.repository.delete(id);
    return { id };
  }

  private async getOrThrow(id: string): Promise<LogEntry> {
    const entry = await this.repository.findById(id);
    if (!entry) throw new NotFoundException('Entry not found');
    return entry;
  }

  /** Entries on one day may touch end-to-start but never overlap. */
  private async assertNoOverlap(
    date: string,
    range: { startMinutes: number; endMinutes: number },
    ignoreId: string | null,
  ): Promise<void> {
    const clash = (await this.repository.findByDate(date)).find(
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
