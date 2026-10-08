import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';
const SEND_TIMEOUT_MS = 15_000;
const DEFAULT_SENDER_NAME = 'NXLogSync';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends transactional email through Brevo's HTTP API with the key in
 * SMTP_BREVO_KEY. The sender (BREVO_SENDER_EMAIL) must be a sender verified
 * in the Brevo account, or Brevo refuses the email.
 */
@Injectable()
export class BrevoMailClient {
  constructor(private readonly config: ConfigService) {}

  async send(message: MailMessage): Promise<void> {
    const apiKey = this.config.get<string>('SMTP_BREVO_KEY');
    const senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL');
    if (!apiKey || !senderEmail) {
      throw new ServiceUnavailableException(
        'Email is not set up on the server (SMTP_BREVO_KEY and BREVO_SENDER_EMAIL)',
      );
    }

    let response: Response;
    try {
      response = await fetch(BREVO_SEND_URL, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            email: senderEmail,
            name:
              this.config.get<string>('BREVO_SENDER_NAME') ||
              DEFAULT_SENDER_NAME,
          },
          to: [{ email: message.to }],
          subject: message.subject,
          htmlContent: message.html,
          textContent: message.text,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
    } catch (error) {
      throw new ServiceUnavailableException(
        `Couldn't reach Brevo: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (!response.ok) {
      // Brevo answers { code, message } on errors.
      const body = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new ServiceUnavailableException(
        `Brevo refused the email (${response.status}${body?.message ? `: ${body.message}` : ''})`,
      );
    }
  }
}
