import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * Reversible encryption for secrets the server must use again later (a site
 * password it types into a login form). Not for user passwords the server only
 * checks — those belong in a one-way hash like bcrypt.
 *
 * Output is "iv:authTag:ciphertext" (base64 parts). GCM's auth tag makes
 * `decrypt` throw if the value was tampered with or the key changed.
 */
@Injectable()
export class EncryptionService {
  private key: Buffer | null = null;

  constructor(private readonly config: ConfigService) {}

  encrypt(plain: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    return [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString('base64'))
      .join(':');
  }

  decrypt(encrypted: string): string {
    const [iv, tag, ciphertext] = encrypted
      .split(':')
      .map((part) => Buffer.from(part, 'base64'));
    if (!iv || !tag || !ciphertext) {
      throw new Error('Encrypted value is malformed');
    }
    const decipher = createDecipheriv(ALGORITHM, this.getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }

  private getKey(): Buffer {
    if (this.key) return this.key;
    const key = Buffer.from(
      this.config.getOrThrow<string>('CREDENTIALS_ENCRYPTION_KEY'),
      'base64',
    );
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `CREDENTIALS_ENCRYPTION_KEY must be ${KEY_BYTES} bytes, base64-encoded (openssl rand -base64 32)`,
      );
    }
    this.key = key;
    return key;
  }
}
