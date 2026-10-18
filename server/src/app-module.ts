import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health-controller';
import { PrismaModule } from './infrastructures/prisma/prisma-module';
import { AimLabModule } from './modules/aim-lab/modules/aim-lab-module';
import { AttendanceModule } from './modules/attendance/modules/attendance-module';
import { CredentialsModule } from './modules/credentials/modules/credentials-module';
import { JobsModule } from './modules/jobs/modules/jobs-module';
import { LogEntriesModule } from './modules/log-entries/modules/log-entries-module';
import { RemindersModule } from './modules/reminders/modules/reminders-module';
import { ReportsModule } from './modules/reports/modules/reports-module';
import { RunYourselfModule } from './modules/run-yourself/modules/run-yourself-module';
import { SyncModule } from './modules/sync/modules/sync-module';
import { TetrisModule } from './modules/tetris/modules/tetris-module';
import { TypingModule } from './modules/typing/modules/typing-module';
import { SessionAuthGuard } from './shared/guards/session-auth-guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AimLabModule,
    AttendanceModule,
    CredentialsModule,
    JobsModule,
    LogEntriesModule,
    RemindersModule,
    ReportsModule,
    RunYourselfModule,
    SyncModule,
    TetrisModule,
    TypingModule,
  ],
  controllers: [HealthController],
  // Every route needs the session token from Connect unless marked @Public().
  providers: [{ provide: APP_GUARD, useClass: SessionAuthGuard }],
})
export class AppModule {}
