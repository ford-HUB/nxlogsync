import { Module } from '@nestjs/common';
import { AimLabController } from '../controllers/aim-lab-controller';
import { AimLabRepository } from '../repositories/aim-lab-repository';
import { AimLabService } from '../services/aim-lab-service';

@Module({
  controllers: [AimLabController],
  providers: [AimLabService, AimLabRepository],
})
export class AimLabModule {}
