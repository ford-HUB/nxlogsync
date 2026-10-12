import { Module } from '@nestjs/common';
import { RunSettingsController } from '../controllers/settings-controller';
import { RunSettingsRepository } from '../repositories/settings-repository';
import { RunSettingsService } from '../services/settings-service';

@Module({
  controllers: [RunSettingsController],
  providers: [RunSettingsService, RunSettingsRepository],
})
export class RunSettingsModule {}
