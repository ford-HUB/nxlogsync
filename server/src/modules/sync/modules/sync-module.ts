import { Module } from '@nestjs/common';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { MailModule } from '../../../infrastructures/mail/mail-module';
import { LogEntriesModule } from '../../log-entries/modules/log-entries-module';
import { RemindersModule } from '../../reminders/modules/reminders-module';
import { SyncController } from '../controllers/sync-controller';
import { SyncRepository } from '../repositories/sync-repository';
import { SyncScheduler } from '../services/sync-scheduler';
import { SyncService } from '../services/sync-service';

@Module({
  imports: [NpaxWorkflowModule, LogEntriesModule, MailModule, RemindersModule],
  controllers: [SyncController],
  providers: [SyncService, SyncScheduler, SyncRepository],
})
export class SyncModule {}
