import { Injectable } from '@nestjs/common';
import {
  PassOrFallProgress,
  TypingPlayer,
} from '../../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../../infrastructures/prisma/prisma-service';
import {
  PassOrFallProgressDto,
  PassOrFallScoreDto,
} from '../dto/pass-or-fall-dto';

/** Each user's Pass or fall progress and best run, one row per user. */
@Injectable()
export class PassOrFallRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(userId: string): Promise<PassOrFallProgress | null> {
    return this.prisma.passOrFallProgress.findUnique({ where: { userId } });
  }

  saveProgress(
    userId: string,
    data: PassOrFallProgressDto,
  ): Promise<PassOrFallProgress> {
    return this.prisma.passOrFallProgress.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  /** Records a finished run as the best. A run can end before any door, so this may create the row at room 0. */
  saveBest(
    userId: string,
    data: PassOrFallScoreDto,
  ): Promise<PassOrFallProgress> {
    const best = {
      bestPoints: data.points,
      bestLevels: data.levels,
      bestSeconds: data.seconds,
    };
    return this.prisma.passOrFallProgress.upsert({
      where: { userId },
      create: { userId, level: 0, points: 0, seconds: 0, ...best },
      update: best,
    });
  }

  /** Best runs, most points first, faster first on a tie. */
  top(take: number): Promise<PassOrFallProgress[]> {
    return this.prisma.passOrFallProgress.findMany({
      where: { bestPoints: { not: null } },
      orderBy: [{ bestPoints: 'desc' }, { bestSeconds: 'asc' }],
      take,
    });
  }

  /** Runs that beat this one (more points, or as many and faster), for a rank off the board. */
  countAhead(points: number, seconds: number): Promise<number> {
    return this.prisma.passOrFallProgress.count({
      where: {
        OR: [
          { bestPoints: { gt: points } },
          { bestPoints: points, bestSeconds: { lt: seconds } },
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
