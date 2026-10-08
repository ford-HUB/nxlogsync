import { Module } from '@nestjs/common';
import { MailModule } from '../../../infrastructures/mail/mail-module';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { LogEntriesModule } from '../../log-entries/modules/log-entries-module';
import { RemindersController } from '../controllers/reminders-controller';
import { RemindersRepository } from '../repositories/reminders-repository';
import { ReminderScheduler } from '../services/reminder-scheduler';
import { RemindersService } from '../services/reminders-service';

@Module({
  imports: [NpaxWorkflowModule, LogEntriesModule, MailModule],
  controllers: [RemindersController],
  providers: [RemindersService, ReminderScheduler, RemindersRepository],
  exports: [RemindersService],
})
export class RemindersModule {}
