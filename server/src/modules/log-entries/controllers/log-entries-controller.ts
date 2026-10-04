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
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type {
  CreateLogEntryDto,
  ListLogEntriesQueryDto,
  UpdateLogEntryDto,
} from '../dto/log-entries-dto';
import { LogEntriesService } from '../services/log-entries-service';
import {
  CreateLogEntrySchema,
  ListLogEntriesQuerySchema,
  UpdateLogEntrySchema,
} from '../validators/log-entries-validator';

@Controller('v1/log-entries')
export class LogEntriesController {
  constructor(private readonly logEntriesService: LogEntriesService) {}

  // GET /api/v1/log-entries?from=YYYY-MM-DD&to=YYYY-MM-DD → entries, oldest first
  @Get()
  async list(
    @Query(new ZodValidationPipe(ListLogEntriesQuerySchema))
    query: ListLogEntriesQueryDto,
  ) {
    return await this.logEntriesService.list(query);
  }

  // POST /api/v1/log-entries { date, startMinutes, endMinutes, description } → entry
  @Post()
  async create(
    @Body(new ZodValidationPipe(CreateLogEntrySchema)) body: CreateLogEntryDto,
  ) {
    return await this.logEntriesService.create(body);
  }

  // PATCH /api/v1/log-entries/:id { startMinutes, endMinutes, description } → entry
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateLogEntrySchema)) body: UpdateLogEntryDto,
  ) {
    return await this.logEntriesService.update(id, body);
  }

  // DELETE /api/v1/log-entries/:id → { id }
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.logEntriesService.remove(id);
  }
}
