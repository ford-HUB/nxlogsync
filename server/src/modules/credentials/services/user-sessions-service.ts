import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { UserSessionsRepository } from '../repositories/user-sessions-repository';

const TOKEN_BYTES = 32;

/**
 * Session tokens for desktops signed in through Connect. The raw token goes to
 * the desktop once; only its SHA-256 hash is stored, so a database dump can't
 * be replayed as a login.
 */
@Injectable()
export class UserSessionsService {
  constructor(private readonly repository: UserSessionsRepository) {}

  async issue(userId: string): Promise<string> {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    await this.repository.create(hashToken(token), userId);
    return token;
  }

  findUser(token: string): Promise<string | null> {
    return this.repository.findUserId(hashToken(token));
  }

  /** Signs every desktop of this user out. */
  revokeAll(userId: string): Promise<void> {
    return this.repository.deleteForUser(userId);
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
