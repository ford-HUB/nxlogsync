import { Module } from '@nestjs/common';
import { CredentialsModule } from '../../credentials/modules/credentials-module';
import { TypingController } from '../controllers/typing-controller';
import { TypingDuelGateway } from '../controllers/typing-duel-gateway';
import { TypingGateway } from '../controllers/typing-gateway';
import { TypingRepository } from '../repositories/typing-repository';
import { TypingDuelService } from '../services/typing-duel-service';
import { TypingService } from '../services/typing-service';

@Module({
  imports: [CredentialsModule],
  controllers: [TypingController],
  providers: [
    TypingService,
    TypingRepository,
    TypingGateway,
    TypingDuelService,
    TypingDuelGateway,
  ],
})
export class TypingModule {}
