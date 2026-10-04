import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CredentialsService } from './credentials-service';

// N-PAX expires idle sessions after a few minutes, so check well inside that.
const DEFAULT_KEEPALIVE_MS = 30_000;

/**
 * Checks every connected user's N-PAX session on a fixed interval. Each check loads a
 * signed-in page (which resets the site's idle timer) and logs in again with
 * retries if the site has already expired the session.
 */
@Injectable()
export class SessionKeepaliveScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SessionKeepaliveScheduler.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly credentials: CredentialsService,
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = Number(
      this.config.get('NPAX_KEEPALIVE_MS') ?? DEFAULT_KEEPALIVE_MS,
    );
    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.logger.log(`Checking N-PAX sessions every ${intervalMs / 1000}s`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    // A check with retries can outlast the interval; never stack them.
    if (this.running) return;
    this.running = true;
    try {
      await this.credentials.checkAll();
    } finally {
      this.running = false;
    }
  }
}
