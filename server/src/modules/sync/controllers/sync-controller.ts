import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type { ListSyncRunsQueryDto, SyncScheduleDto } from '../dto/sync-dto';
import { SyncService } from '../services/sync-service';
import {
  ListSyncRunsQuerySchema,
  SyncScheduleSchema,
} from '../validators/sync-validator';

@Controller('v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // GET /api/v1/sync/schedule → schedule
  @Get('schedule')
  async getSchedule() {
    return await this.syncService.getSchedule();
  }

  // PUT /api/v1/sync/schedule { …schedule } → schedule
  @Put('schedule')
  async saveSchedule(
    @Body(new ZodValidationPipe(SyncScheduleSchema)) body: SyncScheduleDto,
  ) {
    return await this.syncService.saveSchedule(body);
  }

  // GET /api/v1/sync/runs?limit=20 → runs, newest first
  @Get('runs')
  async listRuns(
    @Query(new ZodValidationPipe(ListSyncRunsQuerySchema))
    query: ListSyncRunsQueryDto,
  ) {
    return await this.syncService.listRuns(query.limit);
  }

  // POST /api/v1/sync/runs → the started run (status 'running'); poll GET runs for the result
  @Post('runs')
  async startRun() {
    return await this.syncService.startRun('manual');
  }

  // GET /api/v1/sync/pending → { days, minutes } not yet uploaded
  @Get('pending')
  async getPending() {
    return await this.syncService.getPending();
  }
}
