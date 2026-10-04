import { INestApplicationContext, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionModule } from '../infrastructures/encryption/encryption-module';
import { EncryptionService } from '../infrastructures/encryption/encryption-service';
import { NpaxWorkflowClient } from '../infrastructures/npax-workflow/npax-workflow-client';
import { NpaxWorkflowModule } from '../infrastructures/npax-workflow/npax-workflow-module';
import { PrismaModule } from '../infrastructures/prisma/prisma-module';
import { CredentialsRepository } from '../modules/credentials/repositories/credentials-repository';
import { LogEntriesRepository } from '../modules/log-entries/repositories/log-entries-repository';

/**
 * Just what the N-PAX command-line tools need: no controllers or schedulers,
 * so running one never starts a sync.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EncryptionModule,
    NpaxWorkflowModule,
  ],
  providers: [CredentialsRepository, LogEntriesRepository],
})
export class NpaxCliModule {}

/** Logs the N-PAX client in with the login saved by the desktop's Connect. */
export async function connectSavedLogin(
  app: INestApplicationContext,
): Promise<NpaxWorkflowClient> {
  const saved = await app.get(CredentialsRepository).find();
  if (!saved) {
    throw new Error(
      'No saved N-PAX login. Connect from the desktop app first.',
    );
  }
  const password = app.get(EncryptionService).decrypt(saved.passwordEncrypted);
  const npax = app.get(NpaxWorkflowClient);
  if (!(await npax.connect(saved.userId, password))) {
    throw new Error('N-PAX rejected the saved login.');
  }
  return npax;
}
