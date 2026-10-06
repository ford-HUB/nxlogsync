import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type { TimeInQueryDto } from '../dto/attendance-dto';
import { AttendanceService } from '../services/attendance-service';
import { TimeInQuerySchema } from '../validators/attendance-validator';

// Reads the signed-in user's attendance from N-PAX.
@Controller('v1/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // GET /api/v1/attendance/time-in?date=YYYY-MM-DD → { date, timeIn: "HH:mm" | null }
  @Get('time-in')
  async timeIn(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(TimeInQuerySchema)) query: TimeInQueryDto,
  ) {
    return await this.attendanceService.getTimeIn(user, query.date);
  }
}
