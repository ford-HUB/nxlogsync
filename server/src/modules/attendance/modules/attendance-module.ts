import { Module } from '@nestjs/common';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { AttendanceController } from '../controllers/attendance-controller';
import { AttendanceService } from '../services/attendance-service';

@Module({
  imports: [NpaxWorkflowModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
