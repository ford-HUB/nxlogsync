import { BadRequestException, Injectable } from '@nestjs/common';
import { TetrisGateway } from '../controllers/tetris-gateway';
import {
  TetrisLeaderboardEntryDto,
  TetrisLeaderboardResponseDto,
  TetrisScoreDto,
  TetrisScoreResponseDto,
  TetrisSettingsDto,
  TetrisSettingsResponseDto,
} from '../dto/tetris-dto';
import {
  TetrisRepository,
  TetrisScoreWithName,
} from '../repositories/tetris-repository';
import {
  TETRIS_LEADERBOARD_SIZE,
  TetrisKeyBindingsSchema,
} from '../validators/tetris-validator';

const toEntries = (
  top: TetrisScoreWithName[],
  userId: string,
): TetrisLeaderboardEntryDto[] =>
  top.map((s) => ({
    id: s.id,
    name: s.player.name,
    score: s.score,
    lines: s.lines,
    you: s.userId === userId,
  }));

/**
 * The Tetris leaderboard: only each user's best game per start level is kept and
 * ranked, under the name they picked for the typing test. A new best is pushed
 * live to everyone watching that start level (see TetrisGateway).
 */
@Injectable()
export class TetrisService {
  constructor(
    private readonly repository: TetrisRepository,
    private readonly gateway: TetrisGateway,
  ) {}

  async leaderboard(
    userId: string,
    setup: string,
  ): Promise<TetrisLeaderboardResponseDto> {
    const top = await this.repository.top(setup, TETRIS_LEADERBOARD_SIZE);
    const entries = toEntries(top, userId);

    const index = top.findIndex((s) => s.userId === userId);
    if (index >= 0) {
      const { score, lines } = top[index];
      return { setup, entries, you: { rank: index + 1, score, lines } };
    }
    const own = await this.repository.findScore(userId, setup);
    if (!own) return { setup, entries, you: null };
    const rank = (await this.repository.countHigher(setup, own.score)) + 1;
    return {
      setup,
      entries,
      you: { rank, score: own.score, lines: own.lines },
    };
  }

  /** Keeps the game when it beats the user's best for the start level; returns the board after. */
  async submitScore(
    userId: string,
    data: TetrisScoreDto,
  ): Promise<TetrisScoreResponseDto> {
    if (!(await this.repository.findPlayer(userId))) {
      throw new BadRequestException(
        'Pick a leaderboard name before saving a score.',
      );
    }
    const best = await this.repository.findScore(userId, data.setup);
    const personalBest = !best || data.score > best.score;
    if (!personalBest) {
      return { ...(await this.leaderboard(userId, data.setup)), personalBest };
    }
    await this.repository.saveScore(userId, data);
    const board = await this.leaderboard(userId, data.setup);
    // Same top 100 for every watcher; only the `you` flag differs per user.
    const top = await this.repository.top(data.setup, TETRIS_LEADERBOARD_SIZE);
    void this.gateway.pushBoard(data.setup, (watcher) =>
      toEntries(top, watcher),
    );
    return { ...board, personalBest };
  }

  /** The user's saved controls; null when none are saved or they no longer fit the current actions. */
  async settings(userId: string): Promise<TetrisSettingsResponseDto> {
    const saved = await this.repository.findSettings(userId);
    const keys = TetrisKeyBindingsSchema.safeParse(saved?.keys);
    return { keys: keys.success ? keys.data : null };
  }

  async saveSettings(
    userId: string,
    data: TetrisSettingsDto,
  ): Promise<TetrisSettingsResponseDto> {
    await this.repository.saveSettings(userId, data);
    return { keys: data.keys };
  }
}
