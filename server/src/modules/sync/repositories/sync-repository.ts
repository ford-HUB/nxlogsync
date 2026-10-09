import { Injectable } from '@nestjs/common';
import {
  SyncRun,
  SyncSchedule,
} from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { SyncRunStatus, SyncScheduleDto, SyncTrigger } from '../dto/sync-dto';

/**
 * Schedules and runs, one schedule row per user (keyed by the user's key, see
 * toUserKey). A user's schedule row is created with the column defaults the
 * first time it is read.
 */
@Injectable()
export class SyncRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSchedule(userId: string): Promise<SyncSchedule> {
    return this.prisma.syncSchedule.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  /** Every saved schedule, for the scheduler to check each user's run times. */
  listSchedules(): Promise<SyncSchedule[]> {
    return this.prisma.syncSchedule.findMany();
  }

  saveSchedule(userId: string, data: SyncScheduleDto): Promise<SyncSchedule> {
    return this.prisma.syncSchedule.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  listRuns(userId: string, limit: number): Promise<SyncRun[]> {
    return this.prisma.syncRun.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  createRun(userId: string, trigger: SyncTrigger): Promise<SyncRun> {
    return this.prisma.syncRun.create({
      data: { userId, trigger, status: 'running' },
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
        message:
          'The server stopped before this sync finished; it resumes once N-PAX is logged in again',
      },
    });
  }

  /** When the user's most recent run started, of any trigger; null if never. */
  async lastRunStartedAt(userId: string): Promise<Date | null> {
    const run = await this.prisma.syncRun.findFirst({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    });
    return run?.startedAt ?? null;
  }

  /** Users whose most recent run failed, interrupted runs included. */
  async usersWithFailedLastRun(): Promise<string[]> {
    const latest = await this.prisma.syncRun.findMany({
      orderBy: [{ userId: 'asc' }, { startedAt: 'desc' }],
      distinct: ['userId'],
      select: { userId: true, status: true },
    });
    return latest
      .filter((run) => run.status === 'failed')
      .map((run) => run.userId);
  }
}
