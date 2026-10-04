import { INestApplicationContext, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionModule } from '../infrastructures/encryption/encryption-module';
import { EncryptionService } from '../infrastructures/encryption/encryption-service';
import { NpaxWorkflowClient } from '../infrastructures/npax-workflow/npax-workflow-client';
import { NpaxWorkflowModule } from '../infrastructures/npax-workflow/npax-workflow-module';
import { NpaxCredential } from '../infrastructures/prisma/common/client';
import { PrismaModule } from '../infrastructures/prisma/prisma-module';
import { CredentialsRepository } from '../modules/credentials/repositories/credentials-repository';
import { LogEntriesRepository } from '../modules/log-entries/repositories/log-entries-repository';
import { toUserKey } from '../shared/utils/user-key-utils';

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

/** The value of a `--user=<N-PAX User ID>` argument, if given. */
export function userArg(): string | undefined {
  const arg = process.argv.find((a) => a.startsWith('--user='));
  return arg?.slice('--user='.length) || undefined;
}

/**
 * Logs the N-PAX client in with a login saved by the desktop's Connect: the
 * one for `loginId` (from `--user=`), or the only one saved when it's omitted.
 * Resolves to the client and the user's key, for scoping repository calls.
 */
export async function connectSavedLogin(
  app: INestApplicationContext,
  loginId: string | undefined,
): Promise<{ npax: NpaxWorkflowClient; user: string }> {
  const repository = app.get(CredentialsRepository);
  let saved: NpaxCredential | null;
  if (loginId) {
    saved = await repository.find(toUserKey(loginId));
    if (!saved) throw new Error(`No saved N-PAX login for ${loginId}.`);
  } else {
    const all = await repository.findAll();
    if (all.length === 0) {
      throw new Error(
        'No saved N-PAX login. Connect from the desktop app first.',
      );
    }
    if (all.length > 1) {
      throw new Error(
        `Several saved logins (${all.map((c) => c.loginId).join(', ')}); pick one with --user=<User ID>.`,
      );
    }
    saved = all[0];
  }
  const password = app.get(EncryptionService).decrypt(saved.passwordEncrypted);
  const npax = app.get(NpaxWorkflowClient);
  if (!(await npax.connect(saved.userId, saved.loginId, password))) {
    throw new Error('N-PAX rejected the saved login.');
  }
  return { npax, user: saved.userId };
}
