import { Module } from '@nestjs/common';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { AttendanceService } from '../services/attendance-service';

@Module({
  imports: [NpaxWorkflowModule],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
