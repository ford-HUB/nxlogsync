import { Module } from '@nestjs/common';
import { NpaxWorkflowClient } from './npax-workflow-client';

@Module({
  providers: [NpaxWorkflowClient],
  exports: [NpaxWorkflowClient],
})
export class NpaxWorkflowModule {}
