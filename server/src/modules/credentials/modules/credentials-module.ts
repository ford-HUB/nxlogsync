import { Module } from '@nestjs/common';
import { EncryptionModule } from '../../../infrastructures/encryption/encryption-module';
import { NpaxWorkflowModule } from '../../../infrastructures/npax-workflow/npax-workflow-module';
import { CredentialsController } from '../controllers/credentials-controller';
import { CredentialsRepository } from '../repositories/credentials-repository';
import { UserSessionsRepository } from '../repositories/user-sessions-repository';
import { CredentialsService } from '../services/credentials-service';
import { SessionKeepaliveScheduler } from '../services/session-keepalive-scheduler';
import { UserSessionsService } from '../services/user-sessions-service';

@Module({
  imports: [NpaxWorkflowModule, EncryptionModule],
  controllers: [CredentialsController],
  providers: [
    CredentialsService,
    CredentialsRepository,
    SessionKeepaliveScheduler,
    UserSessionsService,
    UserSessionsRepository,
  ],
  // SessionAuthGuard (global, registered in AppModule) resolves tokens through this.
  exports: [UserSessionsService],
})
export class CredentialsModule {}
