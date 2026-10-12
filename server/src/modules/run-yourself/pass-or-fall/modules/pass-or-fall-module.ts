import { Module } from '@nestjs/common';
import { PassOrFallController } from '../controllers/pass-or-fall-controller';
import { PassOrFallRepository } from '../repositories/pass-or-fall-repository';
import { PassOrFallService } from '../services/pass-or-fall-service';

@Module({
  controllers: [PassOrFallController],
  providers: [PassOrFallService, PassOrFallRepository],
})
export class PassOrFallModule {}
