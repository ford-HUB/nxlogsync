import { Injectable } from '@nestjs/common';
import {
  TetrisScore,
  TetrisSetting,
  TypingPlayer,
} from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';
import { TetrisScoreDto, TetrisSettingsDto } from '../dto/tetris-dto';

export type TetrisScoreWithName = TetrisScore & {
  player: Pick<TypingPlayer, 'name'>;
};

/** Each user's best Tetris game per start level, under their typing-test leaderboard name. */
@Injectable()
export class TetrisRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The shared leaderboard name; a score can't be saved without one. */
  findPlayer(userId: string): Promise<TypingPlayer | null> {
    return this.prisma.typingPlayer.findUnique({ where: { userId } });
  }

  /** The highest scores for a start level; ties go to whoever set theirs first. */
  top(setup: string, take: number): Promise<TetrisScoreWithName[]> {
    return this.prisma.tetrisScore.findMany({
      where: { setup },
      orderBy: [{ score: 'desc' }, { updatedAt: 'asc' }],
      take,
      include: { player: { select: { name: true } } },
    });
  }

  findScore(userId: string, setup: string): Promise<TetrisScore | null> {
    return this.prisma.tetrisScore.findUnique({
      where: { userId_setup: { userId, setup } },
    });
  }

  /** Games for a start level strictly higher than `score`, for a rank off the board. */
  countHigher(setup: string, score: number): Promise<number> {
    return this.prisma.tetrisScore.count({
      where: { setup, score: { gt: score } },
    });
  }

  saveScore(userId: string, data: TetrisScoreDto): Promise<TetrisScore> {
    const { setup, score, lines, level } = data;
    return this.prisma.tetrisScore.upsert({
      where: { userId_setup: { userId, setup } },
      create: { userId, setup, score, lines, level },
      update: { score, lines, level },
    });
  }

  findSettings(userId: string): Promise<TetrisSetting | null> {
    return this.prisma.tetrisSetting.findUnique({ where: { userId } });
  }

  saveSettings(
    userId: string,
    data: TetrisSettingsDto,
  ): Promise<TetrisSetting> {
    return this.prisma.tetrisSetting.upsert({
      where: { userId },
      create: { userId, keys: data.keys },
      update: { keys: data.keys },
    });
  }
}
