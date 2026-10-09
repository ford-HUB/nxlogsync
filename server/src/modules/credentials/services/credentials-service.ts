import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EncryptionService } from '../../../infrastructures/encryption/encryption-service';
import {
  NpaxSessionStatus,
  NpaxWorkflowClient,
} from '../../../infrastructures/npax-workflow/npax-workflow-client';
import { toUserKey } from '../../../shared/utils/user-key-utils';
import { CredentialsRepository } from '../repositories/credentials-repository';
import { UserSessionsService } from './user-sessions-service';

/**
 * Owns each user's N-PAX login. A successful Connect saves it (password
 * encrypted) so the login comes back after a server restart, and issues the
 * session token the desktop sends from then on; that token is what ties every
 * request, and so every entry, to the user. Disconnect, or the site rejecting
 * the login, deletes the login and signs the user's desktops out. Their
 * entries, schedule and runs stay for when they connect again.
 */
@Injectable()
export class CredentialsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly npax: NpaxWorkflowClient,
    private readonly repository: CredentialsRepository,
    private readonly encryption: EncryptionService,
    private readonly sessions: UserSessionsService,
  ) {}

  /**
   * Picks every saved login back up without logging in: each user is signed in
   * when a task of theirs next runs. Signing everyone in at start-up is what
   * ran the server out of memory, and then did it again on every restart.
   */
  async onApplicationBootstrap(): Promise<void> {
    this.npax.onLoginRejected((user) => {
      void this.forget(user).catch((error: unknown) =>
        this.logger.warn(
          `Couldn't forget the rejected N-PAX login for ${user}: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
    });

    for (const saved of await this.repository.findAll()) {
      let password: string;
      try {
        password = this.encryption.decrypt(saved.passwordEncrypted);
      } catch (error) {
        this.logger.warn(
          `Saved N-PAX login for ${saved.userId} can't be decrypted (was CREDENTIALS_ENCRYPTION_KEY changed?); forgetting it: ${error instanceof Error ? error.message : String(error)}`,
        );
        await this.forget(saved.userId);
        continue;
      }
      this.npax.restoreLogin(saved.userId, saved.loginId, password);
      this.logger.log(`Restored the saved N-PAX login for ${saved.userId}`);
    }
  }

  async verify(loginId: string, password: string): Promise<{ valid: boolean }> {
    return { valid: await this.npax.verifyLogin(loginId, password) };
  }

  /** On success, `token` is the desktop's session token for this user. */
  async connect(
    loginId: string,
    password: string,
  ): Promise<{
    valid: boolean;
    session: NpaxSessionStatus;
    token: string | null;
  }> {
    const user = toUserKey(loginId);
    const valid = await this.npax.connect(user, loginId, password);
    if (!valid) {
      return { valid, session: this.npax.getStatus(user), token: null };
    }
    await this.repository.save(
      user,
      loginId,
      this.encryption.encrypt(password),
    );
    const token = await this.sessions.issue(user);
    return { valid, session: this.npax.getStatus(user), token };
  }

  async disconnect(user: string): Promise<NpaxSessionStatus> {
    await this.forget(user);
    return await this.npax.disconnect(user);
  }

  /** The caller's session; 'disconnected' when no valid token was sent. */
  status(user: string | null): NpaxSessionStatus {
    return this.npax.getStatus(user ?? '');
  }

  /**
   * Checks one user's saved login now. If the site rejected it, the client
   * drops it and the `onLoginRejected` listener forgets the stored copy and
   * signs their desktops out.
   */
  check(user: string): Promise<NpaxSessionStatus> {
    return this.npax.keepAlive(user);
  }

  private async forget(user: string): Promise<void> {
    await this.repository.delete(user);
    await this.sessions.revokeAll(user);
  }
}
