import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type { ListJobsQueryDto } from '../dto/jobs-dto';
import { JobsService } from '../services/jobs-service';
import { ListJobsQuerySchema } from '../validators/jobs-validator';

// The signed-in user's own N-PAX Job lookup; N-PAX lists different jobs per employee.
@Controller('v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // GET /api/v1/jobs?refresh=true → { costCenters, defaultCostCenter, jobs }
  @Get()
  async list(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(ListJobsQuerySchema)) query: ListJobsQueryDto,
  ) {
    return await this.jobsService.list(user, query.refresh === 'true');
  }
}
