import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health-controller';
import { PrismaModule } from './infrastructures/prisma/prisma-module';
import { CredentialsModule } from './modules/credentials/modules/credentials-module';
import { LogEntriesModule } from './modules/log-entries/modules/log-entries-module';
import { SyncModule } from './modules/sync/modules/sync-module';
import { SessionAuthGuard } from './shared/guards/session-auth-guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CredentialsModule,
    LogEntriesModule,
    SyncModule,
  ],
  controllers: [HealthController],
  // Every route needs the session token from Connect unless marked @Public().
  providers: [{ provide: APP_GUARD, useClass: SessionAuthGuard }],
})
export class AppModule {}
