import { Injectable } from '@nestjs/common';
import {
  AimLabScore,
  AimLabSetting,
  TypingPlayer,
} from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { AimLabScoreDto, AimLabSettingsDto } from '../dto/aim-lab-dto';

export type AimLabScoreWithName = AimLabScore & {
  player: Pick<TypingPlayer, 'name'>;
};

/** Each user's best Aim lab session per mode, under their typing-test leaderboard name. */
@Injectable()
export class AimLabRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The shared leaderboard name; a score can't be saved without one. */
  findPlayer(userId: string): Promise<TypingPlayer | null> {
    return this.prisma.typingPlayer.findUnique({ where: { userId } });
  }

  /** The best sessions for a mode; ties go to whoever set theirs first. */
  top(
    setup: string,
    lowerWins: boolean,
    take: number,
  ): Promise<AimLabScoreWithName[]> {
    return this.prisma.aimLabScore.findMany({
      where: { setup },
      orderBy: [{ score: lowerWins ? 'asc' : 'desc' }, { updatedAt: 'asc' }],
      take,
      include: { player: { select: { name: true } } },
    });
  }

  findScore(userId: string, setup: string): Promise<AimLabScore | null> {
    return this.prisma.aimLabScore.findUnique({
      where: { userId_setup: { userId, setup } },
    });
  }

  /** Sessions for a mode strictly better than `score`, for a rank off the board. */
  countBetter(
    setup: string,
    lowerWins: boolean,
    score: number,
  ): Promise<number> {
    return this.prisma.aimLabScore.count({
      where: { setup, score: lowerWins ? { lt: score } : { gt: score } },
    });
  }

  saveScore(userId: string, data: AimLabScoreDto): Promise<AimLabScore> {
    const { setup, score, accuracy, shotsFired, shotsHit } = data;
    return this.prisma.aimLabScore.upsert({
      where: { userId_setup: { userId, setup } },
      create: { userId, setup, score, accuracy, shotsFired, shotsHit },
      update: { score, accuracy, shotsFired, shotsHit },
    });
  }

  findSettings(userId: string): Promise<AimLabSetting | null> {
    return this.prisma.aimLabSetting.findUnique({ where: { userId } });
  }

  saveSettings(
    userId: string,
    data: AimLabSettingsDto,
  ): Promise<AimLabSetting> {
    return this.prisma.aimLabSetting.upsert({
      where: { userId },
      create: { userId, sensitivity: data.sensitivity },
      update: { sensitivity: data.sensitivity },
    });
  }
}
