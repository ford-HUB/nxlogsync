import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { EncryptionService } from '../../../infrastructures/encryption/encryption-service';
import {
  NpaxSessionStatus,
  NpaxWorkflowClient,
} from '../../../infrastructures/npax-workflow/npax-workflow-client';
import { CredentialsRepository } from '../repositories/credentials-repository';

/**
 * Owns the N-PAX login. Connect saves it (password encrypted) so the session
 * comes back after a server restart; Disconnect, or the site rejecting it,
 * deletes it.
 */
@Injectable()
export class CredentialsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly npax: NpaxWorkflowClient,
    private readonly repository: CredentialsRepository,
    private readonly encryption: EncryptionService,
  ) {}

  /** Picks the saved login back up; the first keep-alive check logs in with it. */
  async onApplicationBootstrap(): Promise<void> {
    const saved = await this.repository.find();
    if (!saved) return;
    let password: string;
    try {
      password = this.encryption.decrypt(saved.passwordEncrypted);
    } catch (error) {
      this.logger.warn(
        `Saved N-PAX login can't be decrypted (was CREDENTIALS_ENCRYPTION_KEY changed?); forgetting it: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.repository.delete();
      return;
    }
    this.npax.restoreLogin(saved.userId, password);
    this.logger.log(`Restored the saved N-PAX login for ${saved.userId}`);
    void this.check().catch(() => undefined);
  }

  async verify(userId: string, password: string): Promise<{ valid: boolean }> {
    return { valid: await this.npax.verifyLogin(userId, password) };
  }

  async connect(
    userId: string,
    password: string,
  ): Promise<{ valid: boolean; session: NpaxSessionStatus }> {
    const valid = await this.npax.connect(userId, password);
    if (valid) {
      await this.repository.save(userId, this.encryption.encrypt(password));
    }
    return { valid, session: this.npax.getStatus() };
  }

  async disconnect(): Promise<NpaxSessionStatus> {
    await this.repository.delete();
    return await this.npax.disconnect();
  }

  status(): NpaxSessionStatus {
    return this.npax.getStatus();
  }

  /**
   * Runs a keep-alive check now. If the site rejected the saved login, the
   * client has dropped it, so the stored copy goes too.
   */
  async check(): Promise<NpaxSessionStatus> {
    const status = await this.npax.keepAlive();
    if (status.state === 'disconnected') await this.repository.delete();
    return status;
  }
}
