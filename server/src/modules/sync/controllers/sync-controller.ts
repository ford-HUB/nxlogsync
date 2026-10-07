import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type {
  EndorseDayDto,
  ListSyncRunsQueryDto,
  SyncScheduleDto,
} from '../dto/sync-dto';
import { SyncService } from '../services/sync-service';
import {
  EndorseDaySchema,
  ListSyncRunsQuerySchema,
  SyncScheduleSchema,
} from '../validators/sync-validator';

// Every route acts on the signed-in user's schedule, runs and entries only.
@Controller('v1/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // GET /api/v1/sync/schedule → schedule
  @Get('schedule')
  async getSchedule(@CurrentUser() user: string) {
    return await this.syncService.getSchedule(user);
  }

  // PUT /api/v1/sync/schedule { …schedule } → schedule
  @Put('schedule')
  async saveSchedule(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(SyncScheduleSchema)) body: SyncScheduleDto,
  ) {
    return await this.syncService.saveSchedule(user, body);
  }

  // GET /api/v1/sync/runs?limit=20 → runs, newest first
  @Get('runs')
  async listRuns(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(ListSyncRunsQuerySchema))
    query: ListSyncRunsQueryDto,
  ) {
    return await this.syncService.listRuns(user, query.limit);
  }

  // POST /api/v1/sync/runs → the started run (status 'running'); poll GET runs for the result
  @Post('runs')
  async startRun(@CurrentUser() user: string) {
    return await this.syncService.startRun(user, 'manual');
  }

  // POST /api/v1/sync/endorse { date } → { date, outcome }; presses Endorse on N-PAX, which can't be undone
  @Post('endorse')
  async endorseDay(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(EndorseDaySchema)) body: EndorseDayDto,
  ) {
    return await this.syncService.endorseDay(user, body.date);
  }

  // GET /api/v1/sync/pending → { days, minutes } not yet uploaded
  @Get('pending')
  async getPending(@CurrentUser() user: string) {
    return await this.syncService.getPending(user);
  }
}
