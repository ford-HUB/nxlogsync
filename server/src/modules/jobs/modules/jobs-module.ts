import { Module } from '@nestjs/common';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { JobsController } from '../controllers/jobs-controller';
import { JobsService } from '../services/jobs-service';

@Module({
  imports: [NpaxWorkflowModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
