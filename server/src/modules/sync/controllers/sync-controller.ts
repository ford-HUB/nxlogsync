import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type {
  AutoEndorseDto,
  EndorseDayDto,
  ListSyncRunsQueryDto,
  SyncScheduleDto,
} from '../dto/sync-dto';
import { AutoEndorseService } from '../services/auto-endorse-service';
import { SyncService } from '../services/sync-service';
import {
  AutoEndorseSchema,
  EndorseDaySchema,
  ListSyncRunsQuerySchema,
  SyncScheduleSchema,
} from '../validators/sync-validator';

// Every route acts on the signed-in user's schedule, runs and entries only.
@Controller('v1/sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly autoEndorse: AutoEndorseService,
  ) {}

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

  // DELETE /api/v1/sync/runs → { cleared }; soft clear, the runs stay in the database
  @Delete('runs')
  async clearRuns(@CurrentUser() user: string) {
    return await this.syncService.clearRuns(user);
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

  // GET /api/v1/sync/auto-endorse → { enabled, dayOfMonth }
  @Get('auto-endorse')
  async getAutoEndorse(@CurrentUser() user: string) {
    return await this.autoEndorse.get(user);
  }

  // PUT /api/v1/sync/auto-endorse { enabled, dayOfMonth } → same; runs at 11:59 PM on that day each month
  @Put('auto-endorse')
  async saveAutoEndorse(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(AutoEndorseSchema)) body: AutoEndorseDto,
  ) {
    return await this.autoEndorse.save(user, body);
  }

  // GET /api/v1/sync/pending → { days, minutes } not yet uploaded
  @Get('pending')
  async getPending(@CurrentUser() user: string) {
    return await this.syncService.getPending(user);
  }
}
