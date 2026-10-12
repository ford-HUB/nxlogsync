import { Module } from '@nestjs/common';
import { PassOrFallModule } from '../pass-or-fall/modules/pass-or-fall-module';
import { RunSettingsModule } from '../settings/modules/settings-module';

/** Run yourself: the player's settings, and Pass or fall's progress and leaderboard. */
@Module({
  imports: [RunSettingsModule, PassOrFallModule],
})
export class RunYourselfModule {}
