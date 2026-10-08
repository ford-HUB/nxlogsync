import { Module } from '@nestjs/common';
import { BrevoMailClient } from './brevo-mail-client';

@Module({
  providers: [BrevoMailClient],
  exports: [BrevoMailClient],
})
export class MailModule {}
