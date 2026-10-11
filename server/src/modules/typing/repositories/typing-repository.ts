import { Injectable } from '@nestjs/common';
import {
  TypingPlayer,
  TypingScore,
} from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { TypingScoreDto } from '../dto/typing-dto';

export type TypingScoreWithName = TypingScore & {
  player: Pick<TypingPlayer, 'name'>;
};

/** Leaderboard names (one per user) and each user's best run per test setup. */
@Injectable()
export class TypingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPlayer(userId: string): Promise<TypingPlayer | null> {
    return this.prisma.typingPlayer.findUnique({ where: { userId } });
  }

  findPlayerByNameKey(nameKey: string): Promise<TypingPlayer | null> {
    return this.prisma.typingPlayer.findUnique({ where: { nameKey } });
  }

  savePlayer(
    userId: string,
    name: string,
    nameKey: string,
  ): Promise<TypingPlayer> {
    return this.prisma.typingPlayer.upsert({
      where: { userId },
      create: { userId, name, nameKey },
      update: { name, nameKey },
    });
  }

  /** The fastest runs for a setup; ties go to whoever set theirs first. */
  top(setup: string, take: number): Promise<TypingScoreWithName[]> {
    return this.prisma.typingScore.findMany({
      where: { setup },
      orderBy: [{ wpm: 'desc' }, { updatedAt: 'asc' }],
      take,
      include: { player: { select: { name: true } } },
    });
  }

  findScore(userId: string, setup: string): Promise<TypingScore | null> {
    return this.prisma.typingScore.findUnique({
      where: { userId_setup: { userId, setup } },
    });
  }

  /** Runs for a setup strictly faster than `wpm`, for a rank off the board. */
  countFaster(setup: string, wpm: number): Promise<number> {
    return this.prisma.typingScore.count({
      where: { setup, wpm: { gt: wpm } },
    });
  }

  saveScore(userId: string, data: TypingScoreDto): Promise<TypingScore> {
    const { setup, wpm, accuracy } = data;
    return this.prisma.typingScore.upsert({
      where: { userId_setup: { userId, setup } },
      create: { userId, setup, wpm, accuracy },
      update: { wpm, accuracy },
    });
  }
}
