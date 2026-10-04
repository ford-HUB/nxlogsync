import { Module } from '@nestjs/common';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { LogEntriesModule } from '../../log-entries/modules/log-entries-module';
import { SyncController } from '../controllers/sync-controller';
import { SyncRepository } from '../repositories/sync-repository';
import { SyncScheduler } from '../services/sync-scheduler';
import { SyncService } from '../services/sync-service';

@Module({
  imports: [NpaxWorkflowModule, LogEntriesModule],
  controllers: [SyncController],
  providers: [SyncService, SyncScheduler, SyncRepository],
})
export class SyncModule {}
