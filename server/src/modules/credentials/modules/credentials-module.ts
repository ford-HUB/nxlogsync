import { Module } from '@nestjs/common';
import { EncryptionModule } from '../../../infrastructures/encryption/encryption-module';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { CredentialsController } from '../controllers/credentials-controller';
import { CredentialsRepository } from '../repositories/credentials-repository';
import { CredentialsService } from '../services/credentials-service';
import { SessionKeepaliveScheduler } from '../services/session-keepalive-scheduler';

@Module({
  imports: [NpaxWorkflowModule, EncryptionModule],
  controllers: [CredentialsController],
  providers: [
    CredentialsService,
    CredentialsRepository,
    SessionKeepaliveScheduler,
  ],
})
export class CredentialsModule {}
