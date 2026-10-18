import { Injectable } from '@nestjs/common';
import {
  SpeedRunLeaderboardResponseDto,
  SpeedRunScoreDto,
  SpeedRunScoreResponseDto,
} from '../dto/speed-run-dto';
import { SpeedRunRepository } from '../repositories/speed-run-repository';
import { SPEED_RUN_LEADERBOARD_SIZE } from '../validators/speed-run-validator';

/**
 * Speed run: the leaderboard of best runs, under the name picked for the typing test. A run an
 * enemy knocked out still scores its points; on a tie the one that got further, then the faster,
 * wins. Players without a name keep their best but aren't listed.
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
        metres: r.metres,
        seconds: r.seconds,
        you: r.userId === userId,
      }));

    const own = await this.repository.find(userId);
    if (!own) return { entries, you: null };
    const listed = entries.findIndex((e) => e.you);
    const rank =
      listed >= 0
        ? listed + 1
        : (await this.repository.countAhead(
            own.points,
            own.metres,
            own.seconds,
          )) + 1;
    return {
      entries,
      you: {
        rank,
        points: own.points,
        metres: own.metres,
        seconds: own.seconds,
      },
    };
  }

  /** Keeps the run when it beats the user's best; returns the board after. */
  async submitScore(
    userId: string,
    data: SpeedRunScoreDto,
  ): Promise<SpeedRunScoreResponseDto> {
    const own = await this.repository.find(userId);
    const personalBest = !own || this.beats(data, own);
    if (personalBest) await this.repository.saveBest(userId, data);
    return { ...(await this.leaderboard(userId)), personalBest };
  }

  /** More points, or as many and further, or as far and faster. */
  private beats(run: SpeedRunScoreDto, best: SpeedRunScoreDto): boolean {
    if (run.points !== best.points) return run.points > best.points;
    if (run.metres !== best.metres) return run.metres > best.metres;
    return run.seconds < best.seconds;
  }
}
