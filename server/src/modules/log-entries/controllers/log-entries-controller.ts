import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type {
  CreateLogEntryDto,
  ListLogEntriesQueryDto,
  ResyncDaysDto,
  UpdateLogEntryDto,
} from '../dto/log-entries-dto';
import { LogEntriesService } from '../services/log-entries-service';
import {
  CreateLogEntrySchema,
  ListLogEntriesQuerySchema,
  ResyncDaysSchema,
  UpdateLogEntrySchema,
} from '../validators/log-entries-validator';

// Every route acts on the signed-in user's entries only.
@Controller('v1/log-entries')
export class LogEntriesController {
  constructor(private readonly logEntriesService: LogEntriesService) {}

  // GET /api/v1/log-entries?from=YYYY-MM-DD&to=YYYY-MM-DD → entries, oldest first
  @Get()
  async list(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(ListLogEntriesQuerySchema))
    query: ListLogEntriesQueryDto,
  ) {
    return await this.logEntriesService.list(user, query);
  }

  // POST /api/v1/log-entries { date, startMinutes, endMinutes, description } → entry
  @Post()
  async create(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(CreateLogEntrySchema)) body: CreateLogEntryDto,
  ) {
    return await this.logEntriesService.create(user, body);
  }

  // POST /api/v1/log-entries/resync { dates } → { dates, entryCount }
  // Only marks the days' entries unsynced; the next sync replaces those days on N-PAX.
  @Post('resync')
  async resyncDays(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(ResyncDaysSchema)) body: ResyncDaysDto,
  ) {
    return await this.logEntriesService.resyncDays(user, body.dates);
  }

  // PATCH /api/v1/log-entries/:id { startMinutes, endMinutes, description } → entry
  @Patch(':id')
  async update(
    @CurrentUser() user: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateLogEntrySchema)) body: UpdateLogEntryDto,
  ) {
    return await this.logEntriesService.update(user, id, body);
  }

  // DELETE /api/v1/log-entries/:id → { id }
  @Delete(':id')
  async remove(
    @CurrentUser() user: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return await this.logEntriesService.remove(user, id);
  }
}
