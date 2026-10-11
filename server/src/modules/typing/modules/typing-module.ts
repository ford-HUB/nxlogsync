import { Module } from '@nestjs/common';
import { CredentialsModule } from '../../credentials/modules/credentials-module';
import { TypingController } from '../controllers/typing-controller';
import { TypingGateway } from '../controllers/typing-gateway';
import { TypingRepository } from '../repositories/typing-repository';
import { TypingService } from '../services/typing-service';

@Module({
  imports: [CredentialsModule],
  controllers: [TypingController],
  providers: [TypingService, TypingRepository, TypingGateway],
})
export class TypingModule {}
