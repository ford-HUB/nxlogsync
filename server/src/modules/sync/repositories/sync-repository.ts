import { Injectable } from '@nestjs/common';
import {
  SyncRun,
  SyncSchedule,
} from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { SyncRunStatus, SyncScheduleDto, SyncTrigger } from '../dto/sync-dto';

// The schedule is a single row; the column defaults are the out-of-the-box schedule.
const SCHEDULE_ID = 1;

@Injectable()
export class SyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSchedule(): Promise<SyncSchedule> {
    return this.prisma.syncSchedule.upsert({
      where: { id: SCHEDULE_ID },
      create: { id: SCHEDULE_ID },
      update: {},
    });
  }

  saveSchedule(data: SyncScheduleDto): Promise<SyncSchedule> {
    return this.prisma.syncSchedule.upsert({
      where: { id: SCHEDULE_ID },
      create: { id: SCHEDULE_ID, ...data },
      update: data,
    });
  }

  listRuns(limit: number): Promise<SyncRun[]> {
    return this.prisma.syncRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  createRun(trigger: SyncTrigger): Promise<SyncRun> {
    return this.prisma.syncRun.create({
      data: { trigger, status: 'running' },
    });
  }

  finishRun(
    id: string,
    result: {
      status: Exclude<SyncRunStatus, 'running'>;
      entryCount: number;
      minutes: number;
      message: string | null;
    },
  ): Promise<SyncRun> {
    return this.prisma.syncRun.update({
      where: { id },
      data: { ...result, finishedAt: new Date() },
    });
  }

  /** Runs left 'running' by a server that stopped mid-sync. */
  async failInterruptedRuns(): Promise<void> {
    await this.prisma.syncRun.updateMany({
      where: { status: 'running' },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        message: 'The server stopped before this sync finished',
      },
    });
  }
}
