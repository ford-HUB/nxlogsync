import { Injectable } from '@nestjs/common';
import {
  TypingDuelRecord,
  TypingPlayer,
  TypingScore,
} from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { TypingScoreDto } from '../dto/typing-dto';

export type TypingScoreWithName = TypingScore & {
  player: Pick<TypingPlayer, 'name'>;
};

export type TypingDuelRecordWithName = TypingDuelRecord & {
  player: Pick<TypingPlayer, 'name'>;
};

/** Most wins first; level on wins, fewer losses, then whoever got there first. */
const DUEL_ORDER = [
  { wins: 'desc' },
  { losses: 'asc' },
  { updatedAt: 'asc' },
] as const;

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

  /** The 1v1 records with the most wins. */
  duelTop(take: number): Promise<TypingDuelRecordWithName[]> {
    return this.prisma.typingDuelRecord.findMany({
      where: { wins: { gt: 0 } },
      orderBy: [...DUEL_ORDER],
      take,
      include: { player: { select: { name: true } } },
    });
  }

  findDuelRecord(userId: string): Promise<TypingDuelRecord | null> {
    return this.prisma.typingDuelRecord.findUnique({ where: { userId } });
  }

  /** Records ranked above one with these wins and losses, for a rank off the board. */
  countDuelAhead(wins: number, losses: number): Promise<number> {
    return this.prisma.typingDuelRecord.count({
      where: {
        OR: [{ wins: { gt: wins } }, { wins, losses: { lt: losses } }],
      },
    });
  }

  /** Adds one decided race to both racers' records, together. */
  async recordDuel(
    a: { userId: string; field: 'wins' | 'losses' | 'draws' },
    b: { userId: string; field: 'wins' | 'losses' | 'draws' },
  ): Promise<void> {
    const upsert = ({ userId, field }: typeof a) =>
      this.prisma.typingDuelRecord.upsert({
        where: { userId },
        create: { userId, [field]: 1 },
        update: { [field]: { increment: 1 } },
      });
    await this.prisma.$transaction([upsert(a), upsert(b)]);
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
