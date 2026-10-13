import { Module } from '@nestjs/common';
import { PassOrFallModule } from '../pass-or-fall/modules/pass-or-fall-module';
import { RunSettingsModule } from '../settings/modules/settings-module';
import { SpeedRunModule } from '../speed-run/modules/speed-run-module';

/** Run yourself: the player's settings, Speed run's leaderboard, and Pass or fall's progress and leaderboard. */
@Module({
  imports: [RunSettingsModule, SpeedRunModule, PassOrFallModule],
})
export class RunYourselfModule {}
