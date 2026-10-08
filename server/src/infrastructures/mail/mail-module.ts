import { Module } from '@nestjs/common';
import { BrevoMailClient } from './brevo-mail-client';
import { MailService } from './mail-service';

@Module({
  providers: [BrevoMailClient, MailService],
  exports: [MailService],
})
export class MailModule {}
