import { Injectable } from '@nestjs/common';
import { RunSetting } from '../../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../../infrastructures/prisma/prisma-service';
import { RunSettingsDto } from '../dto/settings-dto';

/** One Run yourself settings row per user; none until the first save. */
@Injectable()
export class RunSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSettings(userId: string): Promise<RunSetting | null> {
    return this.prisma.runSetting.findUnique({ where: { userId } });
  }

  saveSettings(userId: string, data: RunSettingsDto): Promise<RunSetting> {
    return this.prisma.runSetting.upsert({
      where: { userId },
      create: { userId, keys: data.keys },
      update: { keys: data.keys },
    });
  }
}
