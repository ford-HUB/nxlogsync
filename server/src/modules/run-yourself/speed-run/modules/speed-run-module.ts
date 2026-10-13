import { Module } from '@nestjs/common';
import { SpeedRunController } from '../controllers/speed-run-controller';
import { SpeedRunRepository } from '../repositories/speed-run-repository';
import { SpeedRunService } from '../services/speed-run-service';

@Module({
  controllers: [SpeedRunController],
  providers: [SpeedRunService, SpeedRunRepository],
})
export class SpeedRunModule {}
