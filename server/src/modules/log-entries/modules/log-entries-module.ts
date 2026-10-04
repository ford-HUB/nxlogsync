import { Module } from '@nestjs/common';
import { LogEntriesController } from '../controllers/log-entries-controller';
import { LogEntriesRepository } from '../repositories/log-entries-repository';
import { LogEntriesService } from '../services/log-entries-service';

@Module({
  controllers: [LogEntriesController],
  providers: [LogEntriesService, LogEntriesRepository],
  exports: [LogEntriesRepository],
})
export class LogEntriesModule {}
