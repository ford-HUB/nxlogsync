import { Injectable } from '@nestjs/common';
import {
  SpeedRunBest,
  TypingPlayer,
} from '../../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../../infrastructures/prisma/prisma-service';
import { SpeedRunScoreDto } from '../dto/speed-run-dto';

/** Each user's best Speed run, one row per user. */
@Injectable()
export class SpeedRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(userId: string): Promise<SpeedRunBest | null> {
    return this.prisma.speedRunBest.findUnique({ where: { userId } });
  }

  saveBest(userId: string, data: SpeedRunScoreDto): Promise<SpeedRunBest> {
    return this.prisma.speedRunBest.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /** Best runs, most points first, then the further, then the faster. */
  top(take: number): Promise<SpeedRunBest[]> {
    return this.prisma.speedRunBest.findMany({
      orderBy: [{ points: 'desc' }, { metres: 'desc' }, { seconds: 'asc' }],
      take,
    });
  }

  /** Runs that beat this one (see SpeedRunService.beats), for a rank off the board. */
  countAhead(points: number, metres: number, seconds: number): Promise<number> {
    return this.prisma.speedRunBest.count({
      where: {
        OR: [
          { points: { gt: points } },
          { points, metres: { gt: metres } },
          { points, metres, seconds: { lt: seconds } },
        ],
      },
    });
  }

  /** The leaderboard names (picked in the typing test) for these users. */
  players(userIds: string[]): Promise<Pick<TypingPlayer, 'userId' | 'name'>[]> {
    return this.prisma.typingPlayer.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, name: true },
    });
  }
}
