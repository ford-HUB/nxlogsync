import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AimLabLeaderboardResponseDto,
  AimLabScoreDto,
  AimLabScoreResponseDto,
  AimLabSettingsDto,
  AimLabSettingsResponseDto,
} from '../dto/aim-lab-dto';
import { AimLabRepository } from '../repositories/aim-lab-repository';
import {
  AIM_LAB_LEADERBOARD_SIZE,
  AIM_LAB_LOWER_WINS,
} from '../validators/aim-lab-validator';

/**
 * The Aim lab leaderboard: only each user's best session per mode is kept and
 * ranked, under the name they picked for the typing test. Time attack ranks the
 * fastest time first; every other mode the most kills or hits.
 */
@Injectable()
export class AimLabService {
  constructor(private readonly repository: AimLabRepository) {}

  async leaderboard(
    userId: string,
    setup: string,
  ): Promise<AimLabLeaderboardResponseDto> {
    const lowerWins = AIM_LAB_LOWER_WINS.has(setup);
    const top = await this.repository.top(
      setup,
      lowerWins,
      AIM_LAB_LEADERBOARD_SIZE,
    );
    const entries = top.map((s) => ({
      id: s.id,
      name: s.player.name,
      score: s.score,
      accuracy: s.accuracy,
      you: s.userId === userId,
    }));

    const index = top.findIndex((s) => s.userId === userId);
    if (index >= 0) {
      const { score, accuracy } = top[index];
      return { setup, entries, you: { rank: index + 1, score, accuracy } };
    }
    const own = await this.repository.findScore(userId, setup);
    if (!own) return { setup, entries, you: null };
    const rank =
      (await this.repository.countBetter(setup, lowerWins, own.score)) + 1;
    return {
      setup,
      entries,
      you: { rank, score: own.score, accuracy: own.accuracy },
    };
  }

  /** Keeps the session when it beats the user's best for the mode; returns the board after. */
  async submitScore(
    userId: string,
    data: AimLabScoreDto,
  ): Promise<AimLabScoreResponseDto> {
    if (!(await this.repository.findPlayer(userId))) {
      throw new BadRequestException(
        'Pick a leaderboard name before saving a score.',
      );
    }
    const lowerWins = AIM_LAB_LOWER_WINS.has(data.setup);
    const best = await this.repository.findScore(userId, data.setup);
    const personalBest =
      !best || (lowerWins ? data.score < best.score : data.score > best.score);
    if (personalBest) await this.repository.saveScore(userId, data);
    return { ...(await this.leaderboard(userId, data.setup)), personalBest };
  }

  /** The user's saved sensitivity; null when none is saved. */
  async settings(userId: string): Promise<AimLabSettingsResponseDto> {
    const saved = await this.repository.findSettings(userId);
    return { sensitivity: saved?.sensitivity ?? null };
  }

  async saveSettings(
    userId: string,
    data: AimLabSettingsDto,
  ): Promise<AimLabSettingsResponseDto> {
    await this.repository.saveSettings(userId, data);
    return { sensitivity: data.sensitivity };
  }
}
