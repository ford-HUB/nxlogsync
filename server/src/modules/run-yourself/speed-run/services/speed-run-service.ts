import { Injectable } from '@nestjs/common';
import {
  SpeedRunLeaderboardResponseDto,
  SpeedRunScoreDto,
  SpeedRunScoreResponseDto,
} from '../dto/speed-run-dto';
import { SpeedRunRepository } from '../repositories/speed-run-repository';
import { SPEED_RUN_LEADERBOARD_SIZE } from '../validators/speed-run-validator';

/**
 * Speed run: the leaderboard of best runs to the finish line, under the name picked for the
 * typing test. Players without a name keep their best but aren't listed.
 */
@Injectable()
export class SpeedRunService {
  constructor(private readonly repository: SpeedRunRepository) {}

  async leaderboard(userId: string): Promise<SpeedRunLeaderboardResponseDto> {
    // Over-fetch, since unnamed players drop out of the list.
    const top = await this.repository.top(SPEED_RUN_LEADERBOARD_SIZE * 2);
    const names = new Map(
      (await this.repository.players(top.map((r) => r.userId))).map((p) => [
        p.userId,
        p.name,
      ]),
    );
    const entries = top
      .filter((r) => names.has(r.userId))
      .slice(0, SPEED_RUN_LEADERBOARD_SIZE)
      .map((r) => ({
        id: r.userId,
        name: names.get(r.userId) ?? '',
        points: r.points,
        seconds: r.seconds,
        you: r.userId === userId,
      }));

    const own = await this.repository.find(userId);
    if (!own) return { entries, you: null };
    const listed = entries.findIndex((e) => e.you);
    const rank =
      listed >= 0
        ? listed + 1
        : (await this.repository.countAhead(own.points, own.seconds)) + 1;
    return {
      entries,
      you: { rank, points: own.points, seconds: own.seconds },
    };
  }

  /** Keeps the run when it beats the user's best (more points, or as many and faster); returns the board after. */
  async submitScore(
    userId: string,
    data: SpeedRunScoreDto,
  ): Promise<SpeedRunScoreResponseDto> {
    const own = await this.repository.find(userId);
    const personalBest =
      !own ||
      data.points > own.points ||
      (data.points === own.points && data.seconds < own.seconds);
    if (personalBest) await this.repository.saveBest(userId, data);
    return { ...(await this.leaderboard(userId)), personalBest };
  }
}
