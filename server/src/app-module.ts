import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health-controller';
import { PrismaModule } from './infrastructures/prisma/prisma-module';
import { CredentialsModule } from './modules/credentials/modules/credentials-module';
import { LogEntriesModule } from './modules/log-entries/modules/log-entries-module';
import { SyncModule } from './modules/sync/modules/sync-module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CredentialsModule,
    LogEntriesModule,
    SyncModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
